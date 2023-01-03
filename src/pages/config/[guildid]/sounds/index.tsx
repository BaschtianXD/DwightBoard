import type { NextPage } from "next";
import { useRouter } from "next/router";
import { trpc } from "../../../../utils/trpc";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { Reducer, useReducer, useState } from "react";
import Head from "next/head";

enum DragError {
    TooManyFiles,
    InvalidType,
    InvalidFileType,
    Filesize
}

interface NewSound {
    name: string
    hidden: boolean,
    file: File | null
}

enum newSoundActionType {
    Init,
    InitFromFile,
    Clear,
    SetName,
    ToggleHidden,
    SetFile
}

type NewSoundActionInit = {
    type: newSoundActionType.Init
}
type NewSoundActionInitFromFile = {
    type: newSoundActionType.InitFromFile
    payload: {
        file: File
    }
}
type NewSoundActionClear = {
    type: newSoundActionType.Clear
}
type NewSoundActionSetName = {
    type: newSoundActionType.SetName
    payload: {
        newName: string
    }
}
type NewSoundActionToggleHidden = {
    type: newSoundActionType.ToggleHidden
}
type NewSoundActionSetFile = {
    type: newSoundActionType.SetFile
    payload: {
        file: File | null
    }
}

type NewSoundReducerAction = NewSoundActionInit | NewSoundActionInitFromFile | NewSoundActionClear | NewSoundActionSetName | NewSoundActionToggleHidden | NewSoundActionSetFile

const newSoundReducer: Reducer<NewSound | null, NewSoundReducerAction> = (prevState, action) => {
    switch (action.type) {
        case newSoundActionType.Init:
            return {
                name: "",
                hidden: false,
                file: null
            }
        case newSoundActionType.InitFromFile:
            return {
                name: action.payload.file.name.slice(0, action.payload.file.name.lastIndexOf(".")),
                hidden: false,
                file: action.payload.file
            }
        case newSoundActionType.Clear:
            return null
        case newSoundActionType.SetName:
            return prevState ? {
                ...prevState,
                name: action.payload.newName
            } : null
        case newSoundActionType.ToggleHidden:
            return prevState ? {
                ...prevState,
                hidden: !prevState.hidden
            } : null
        case newSoundActionType.SetFile:
            return prevState ? {
                ...prevState,
                file: action.payload.file
            } : null
    }
}


const MaxFileSize = 204800

const SoundsPage: NextPage = () => {
    const router = useRouter();
    const { guildid } = router.query
    const [dragging, setDragging] = useState(false)
    const [dragError, setDragError] = useState(null as DragError | null)
    const [newSound, setNewSound] = useReducer(newSoundReducer, null as NewSound | null)

    const sounds = trpc.discord.sounds.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    return (
        <div className="h-full w-full bg-slate-400 z-10"
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
                    console.log("Idiot")
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
                setNewSound({ type: newSoundActionType.InitFromFile, payload: { file } })
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
            <div>
                <p>Sounds Page</p>
                {sounds.data && !(dragging || dragError || newSound) &&
                    <table className="table-auto border border-collapse m-1 divide-x">
                        <thead>
                            <tr>
                                <th className="border p-1">Name</th>
                                <th className="border p-1">Hidden</th>
                                <th className="border p-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sounds.data.sounds.map(sound => (
                                <tr key={sound.soundid} className="divide-x">
                                    <td>{sound.name}</td>
                                    <td>
                                        {!sound.hidden ? <EyeSlashIcon className="max-h-6" /> : <EyeIcon className="max-h-6" />}

                                    </td>
                                    <td>
                                        <div>
                                            <span className="cursor-pointer ring-2 rounded m-2 select-none">Delete</span>
                                            <span>Toggle visibility</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
                {sounds.isLoading &&
                    <p>Loading ...</p>
                }
                {newSound &&
                    <div className="flex flex-col gap-4">
                        <p>NewSound</p>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label>Name</label>
                                <input type="text" value={newSound.name} onChange={event => setNewSound({ type: newSoundActionType.SetName, payload: { newName: event.target.value } })} />
                            </div>
                            <div>
                                <label>Hidden</label>
                                <input type="checkbox" value={"" + newSound.hidden} onChange={() => setNewSound({ type: newSoundActionType.ToggleHidden })} />
                            </div>
                            <div>
                                <label>File</label>
                                {newSound.file ?
                                    <div className="flex flex-row gap-4">
                                        <p>{newSound.file.name}</p>
                                        <button onClick={() => setNewSound({ type: newSoundActionType.SetFile, payload: { file: null } })} className="p-2 bg-cyan-400" >Clear file</button>
                                    </div>
                                    :
                                    <input type="file" onChange={event => setNewSound({ type: newSoundActionType.SetFile, payload: { file: event.target.files?.[0] ?? null } })} />
                                }
                            </div>
                            <div>
                                <button>Create sound</button>
                            </div>

                        </div>
                    </div>
                }

                {dragging &&
                    <div className="h-full w-full flex-r">
                        <p>Drop your file here to create a new sound</p>
                    </div>
                }
                {dragError && <p>Drag Error: {dragError}</p>}
            </div>

        </div>

    )
}

export default SoundsPage