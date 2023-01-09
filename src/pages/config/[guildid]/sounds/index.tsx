import type { NextPage } from "next";
import { useRouter } from "next/router";
import { trpc } from "../../../../utils/trpc";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { FC, Fragment, ReactNode, Reducer } from "react";
import { useReducer, useState } from "react";
import Head from "next/head";
import { DefaultButton, LoadingIcon, NegativeButton, PositiveButton, TextInput } from "../../../../components/form";
import { Dialog, Switch, Transition } from "@headlessui/react";
import { pageClasses } from "../../../../components/shared";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

enum DragError {
    TooManyFiles,
    InvalidType,
    InvalidFileType,
    Filesize
}

interface SoundObject {
    soundid?: string
    name: string
    hidden: boolean
    file: File | null
}

type SoundActionCreate = {
    type: "init"
}
type SoundActionCreateFromFile = {
    type: "initFromFile"
    file: File
}
type SoundActionClear = {
    type: "clear"
}
type SoundActionSetName = {
    type: "setName"
    newName: string
}
type SoundActionToggleHidden = {
    type: "toggleHidden"
}
type SoundActionSetFile = {
    type: "setFile",
    file: File | null
}
type SoundActionEdit = {
    type: "edit"
    soundid: string
    name: string
    hidden: boolean
}

type SoundDialogType = "none" | "create" | "edit"

type NewSoundReducerAction = SoundActionCreate | SoundActionCreateFromFile | SoundActionClear | SoundActionSetName | SoundActionToggleHidden | SoundActionSetFile | SoundActionEdit

const newSoundReducer: Reducer<SoundObject | null, NewSoundReducerAction> = (prevState, action) => {
    switch (action.type) {
        case "init":
            return {
                name: "",
                hidden: false,
                file: null
            }
        case "initFromFile":
            return {
                name: action.file.name.slice(0, action.file.name.lastIndexOf(".")),
                hidden: false,
                file: action.file
            }
        case "edit":
            return {
                soundid: action.soundid,
                name: action.name,
                hidden: action.hidden,
                file: null
            }
        case "clear":
            return null
        case "setName":
            return prevState ? {
                ...prevState,
                name: action.newName
            } : null
        case "toggleHidden":
            return prevState ? {
                ...prevState,
                hidden: !prevState.hidden
            } : null
        case "setFile":
            return prevState ? {
                ...prevState,
                file: action.file
            } : null
    }
}


const MaxFileSize = 204800

const SoundsPage: NextPage = () => {
    const router = useRouter();
    const { guildid } = router.query

    const [dragging, setDragging] = useState(false)
    const [dragError, setDragError] = useState(null as DragError | null)

    const [soundObject, dispatchSoundAction] = useReducer(newSoundReducer, null as SoundObject | null)
    const [showSoundDialog, setShowSoundDialog] = useState("none" as SoundDialogType)

    const soundsQuery = trpc.discord.getSounds.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    const soundCreateMutation = trpc.discord.createSound.useMutation()
    const soundDeleteMutation = trpc.discord.deleteSound.useMutation()
    const soundUpdateMutation = trpc.discord.updateSound.useMutation()

    const guildQuery = trpc.discord.getGuild.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })

    if (typeof guildid !== "string") {
        return (<LoadingIcon className="h-20 w-20" />)
    }

    return (
        <div className={pageClasses}
            onDragOver={event => {
                console.log("DragOver")
                event.preventDefault()
            }}
            onDragEnter={ev => {
                console.log("DragEnter")
                ev.preventDefault()
                setDragError(null)
                const items = ev.dataTransfer.items
                if (items.length !== 1 || !items[0]) {
                    setDragError(DragError.TooManyFiles)
                    return
                }
                const item = items[0]
                if (item.kind !== "file") {
                    console.log(item.kind)
                    setDragError(DragError.InvalidType)
                    return
                }
                if (item.type !== "audio/mpeg") {
                    setDragError(DragError.InvalidFileType)
                    return
                }
                setDragging(true)
            }}
            onDrop={ev => {
                console.log("Drop")
                ev.preventDefault()
                setDragging(false)
                if (dragError) {
                    return
                }
                const file = ev.dataTransfer.items[0]?.getAsFile()
                if (!file) {
                    console.error("no file")
                    return
                }
                if (file.size > MaxFileSize) {
                    setDragError(DragError.Filesize)
                    return
                }
                dispatchSoundAction({ type: "initFromFile", file: file })
                setShowSoundDialog("create")
            }}
            onDragEnd={() => {
                console.log("DragEnd")
                setDragError(null)
                setDragging(false)
            }}
            onDragLeave={() => {
                console.log("DragLeave")
                setDragError(null)
                setDragging(false)
            }}
        >
            <Head>
                <title>
                    Sounds
                </title>
            </Head>

            {/* NAV HEADER */}
            <div className="flex gap-2 items-center m-2">
                <ChevronRightIcon className="h-4" />
                <Link href="/config">Config</Link>
                <ChevronRightIcon className="h-4" />
                <Link href={"/config/" + guildid}>Server: {guildQuery.data?.guild.name}</Link>
            </div>

            {/* PAGE HEADER */}
            <div className="flex flex-row flex-wrap w-full justify-between gap-2">
                <p className="font-bold text-4xl">Sounds</p>
                <DefaultButton onClick={() => {
                    dispatchSoundAction({ type: "init" })
                    setShowSoundDialog("create")
                }}>Create new Sound</DefaultButton>
            </div>

            {/* DIALOG */}
            <Transition appear show={showSoundDialog !== "none"} as={Fragment} >
                <Dialog as="div" className="relative z-20" onClose={() => setShowSoundDialog("none")}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all dark:text-white">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-xl font-medium leading-6 mb-4"
                                    >
                                        Create new Sound
                                    </Dialog.Title>
                                    {soundObject && <div className="flex flex-col gap-2">
                                        <div>
                                            <TextInput label="Name" onChange={event => {
                                                dispatchSoundAction({ type: "setName", newName: event.target.value })
                                            }} value={soundObject.name} />
                                        </div>
                                        <div className="w-full flex flex-row gap-2 items-center">
                                            <label className="font-semibold">Visible</label>
                                            <div className="">
                                                <Switch
                                                    checked={!soundObject.hidden}
                                                    onChange={() => dispatchSoundAction({ type: "toggleHidden" })}
                                                    className={`bg-red-500 ui-checked:bg-green-500 relative inline-flex h-[38px] w-[74px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
                                                >
                                                    <span className="sr-only">Use setting</span>
                                                    <span
                                                        aria-hidden="true"
                                                        className={`translate-x-0 ui-checked:translate-x-9 pointer-events-none inline-block h-[34px] w-[34px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                    />
                                                </Switch>
                                            </div>
                                        </div>
                                        {showSoundDialog === "create" &&
                                            <div className="flex items-center gap-2">
                                                <label className="font-semibold">File</label>
                                                {soundObject.file ?
                                                    <div className="flex items-center gap-2">
                                                        <p>{soundObject.file.name}</p>
                                                        <DefaultButton onClick={() => dispatchSoundAction({ type: "setFile", file: null })}>Clear file</DefaultButton>
                                                    </div>
                                                    :
                                                    <div>
                                                        <input type="file" onChange={event => dispatchSoundAction({ type: "setFile", file: event.target.files?.[0] ?? null })} accept="audio/mp3" />
                                                    </div>
                                                }
                                            </div>
                                        }
                                        {!(soundCreateMutation.isLoading || soundUpdateMutation.isLoading) &&
                                            <div className="w-full flex flex-row items-center justify-center gap-4">
                                                <PositiveButton disabled={!soundObject.name || (showSoundDialog === "create" && !soundObject.file)}
                                                    onClick={async () => {
                                                        if (showSoundDialog === "create" && soundObject.file) {
                                                            const fileContent = await getBase64(soundObject.file)
                                                            soundCreateMutation.mutate({ name: soundObject.name, guildid: guildid, hidden: soundObject.hidden, fileData: fileContent }, {
                                                                onSuccess: () => {
                                                                    soundsQuery.refetch()
                                                                    setShowSoundDialog("none")
                                                                }
                                                            })
                                                        } else if (showSoundDialog === "edit" && soundObject.soundid) {
                                                            await soundUpdateMutation.mutateAsync({ name: soundObject.name, hidden: soundObject.hidden, soundid: soundObject.soundid })
                                                            soundsQuery.refetch()
                                                            setShowSoundDialog("none")
                                                        }
                                                    }}>{(showSoundDialog === "create" ? "Create" : "Edit") + " Sound"}</PositiveButton>
                                                <NegativeButton onClick={() => setShowSoundDialog("none")}>Cancel</NegativeButton>
                                            </div>
                                        }

                                        {(soundCreateMutation.isLoading || soundUpdateMutation.isLoading) &&
                                            <LoadingIcon className="w-9 h-9 m-auto" />
                                        }
                                    </div>}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* PAGE CONTENT */}
            {soundsQuery.isSuccess && soundsQuery.data && !(dragging || dragError) &&
                <table className="table-auto border border-collapse m-1 divide-x">
                    <thead>
                        <tr>
                            <th className="border p-1">Name</th>
                            <th className="border p-1">Visibility</th>
                            <th className="border p-1">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {soundsQuery.data.sounds.map(sound => (
                            <tr key={sound.soundid} className="divide-x">
                                <td>{sound.name}</td>
                                <td>
                                    {sound.hidden ? <EyeSlashIcon className="max-h-6 m-auto" /> : <EyeIcon className="max-h-6 m-auto" />}

                                </td>
                                <td>
                                    <div className="flex flex-row gap-2 p-1">
                                        <DefaultButton onClick={() => {
                                            dispatchSoundAction({ type: "edit", name: sound.name, hidden: sound.hidden, soundid: sound.soundid })
                                            setShowSoundDialog("edit")
                                        }}>Edit</DefaultButton>
                                        <DefaultButton onClick={() => {
                                            soundDeleteMutation.mutate({ soundid: sound.soundid }, {
                                                onSuccess: () => {
                                                    soundsQuery.refetch()
                                                }
                                            })
                                        }}>Delete</DefaultButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            }
            {soundsQuery.isLoading &&
                <p>Loading ...</p>
            }

            {dragging &&
                <div className="h-full w-full flex-r">
                    <p>Drop your file here to create a new sound</p>
                </div>
            }
            {dragError && <p>Drag Error: {dragError}</p>}

        </div>

    )
}

export default SoundsPage

async function getBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (!reader.result) {
                return reject()
            }
            let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
                encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
}
