import { Dialog, Listbox, Menu, Transition } from "@headlessui/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import type { Reducer } from "react";
import { useState } from "react";
import { Fragment } from "react";
import { useReducer } from "react";
import { PositiveButton, DefaultButton, TextInput, NegativeButton, LoadingIcon } from "../../../../components/form";
import type { AppRouter } from "../../../../server/trpc/router/_app";
import { trpc } from "../../../../utils/trpc";
import { ChevronDownIcon, ChevronRightIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid"
import { PencilSquareIcon, StopIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { pageClasses } from "../../../../components/shared";

type Sound = inferRouterOutputs<AppRouter>["discord"]["getSounds"]["sounds"][number]

interface Announcement {
    userid: string,
    sound: Sound | null
}

type AnnouncementReducerActionCreate = {
    type: "init"
}

type AnnouncementReducerActionEdit = {
    type: "edit"
    userid: string,
    sound: Sound
}

type AnnouncementReducerActionSetUserid = {
    type: "setUserid",
    userid: string
}

type AnnouncementReducerActionSetSound = {
    type: "setSound",
    sound: Sound
}

type AnnouncementReducerActionClear = {
    type: "clear"
}

type AnnouncementDialogType = "none" | "create" | "edit"

type newAnnouncementReducerAction = AnnouncementReducerActionCreate | AnnouncementReducerActionEdit | AnnouncementReducerActionSetUserid | AnnouncementReducerActionSetSound | AnnouncementReducerActionClear

const newAnnouncementReducer: Reducer<Announcement | null, newAnnouncementReducerAction> = ((prevState, action) => {
    switch (action.type) {
        case "clear":
            return null
        case "init":
            return {
                userid: "",
                sound: null
            }
        case "edit":
            return {
                userid: action.userid,
                sound: action.sound
            }
        case "setSound":
            return prevState ? {
                ...prevState,
                sound: action.sound
            } : null
        case "setUserid":
            return prevState ? {
                ...prevState,
                userid: action.userid
            } : null
    }
})

const AnnouncementPage: NextPage = () => {
    const router = useRouter();
    const { guildid } = router.query
    const announcementsQuery = trpc.discord.getAnnouncements.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    const upsertAnnouncement = trpc.discord.upsertAnnouncement.useMutation()
    const deleteAnnouncement = trpc.discord.deleteAnnouncement.useMutation()

    const [announcementObject, dispatchAnnouncementAction] = useReducer(newAnnouncementReducer, null)

    const [showAnnouncementDialog, setShowAnnouncementDialog] = useState("none" as AnnouncementDialogType)
    const soundsQuery = trpc.discord.getSounds.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string", staleTime: 2000 })

    const guildQuery = trpc.discord.getGuild.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string", staleTime: 1000 * 60 * 5 })


    if (typeof guildid !== "string") {
        return (<LoadingIcon className="h-20 w-20" />)
    }

    const selectValues = soundsQuery.data?.sounds.map(sound => (<option key={sound.soundid} value={sound.soundid}>{sound.name}</option>))
    selectValues?.unshift(<option key="0" disabled>Choose a sound ...</option>)

    return (
        <div className={pageClasses}>

            {/* NAV HEADER */}
            <div className="flex gap-2 items-center m-2">
                <ChevronRightIcon className="h-4" />
                <Link href="/config">Config</Link>
                <ChevronRightIcon className="h-4" />
                <Link href={"/config/" + guildid}>Server: {guildQuery.data?.guild.name}</Link>
            </div>

            {/* PAGE HEADER */}
            <div className="flex flex-row flex-wrap w-full justify-between gap-2">
                <p className="font-bold text-4xl">Announcements</p>
                <DefaultButton onClick={() => {
                    dispatchAnnouncementAction({ type: "init" })
                    setShowAnnouncementDialog("create")
                }}>Create new announcement</DefaultButton>
            </div>

            {/* DIALOG */}
            <Transition appear show={showAnnouncementDialog !== "none"} as={Fragment} >
                <Dialog as="div" className="relative z-20" onClose={() => setShowAnnouncementDialog("none")}>
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
                                        Create new announcement
                                    </Dialog.Title>
                                    {announcementObject && <div className="flex flex-col gap-2">
                                        <div>
                                            <TextInput label="User" disabled={showAnnouncementDialog !== "create"} onChange={event => {
                                                dispatchAnnouncementAction({ type: "setUserid", userid: event.target.value })
                                            }} value={announcementObject.userid} />
                                        </div>
                                        <div className="w-full flex flex-row gap-2 items-center">
                                            <label className="font-semibold">Sound</label>
                                            {soundsQuery.data ?
                                                <Listbox value={announcementObject.sound} onChange={value => value && dispatchAnnouncementAction({ type: "setSound", sound: value })}>
                                                    <Listbox.Button className="rounded-lg p-1 ring-1 ring-gray-500 flex flex-row items-center grow justify-end">
                                                        <span className="block truncate">{announcementObject.sound?.name ?? "Select a sound"}</span>
                                                        <span className="pointer-events-none inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronUpDownIcon
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    </Listbox.Button>
                                                    <Listbox.Options className="absolute right-6 mt-1 max-h-60 overflow-auto rounded-md bg-white dark:bg-gray-900 py-1 text-base shadow-lg ring-2 ring-black dark:ring-gray-500 ring-opacity-5 focus:outline-none sm:text-sm">
                                                        {soundsQuery.data.sounds.map(sound => (
                                                            <Listbox.Option className="relative select-none py-2 pl-2 pr-4 dark:hover:bg-gray-800" key={sound.soundid} value={sound}>
                                                                {sound.name}
                                                            </Listbox.Option>
                                                        ))}
                                                    </Listbox.Options>
                                                </Listbox>
                                                :
                                                <LoadingIcon className="h-5 w-5" />
                                            }
                                        </div>
                                        <div className="w-full flex flex-row items-center justify-center gap-4">
                                            <PositiveButton disabled={!announcementObject.sound || !announcementObject.userid} onClick={() => upsertAnnouncement.mutate({ guildid: guildid, userid: announcementObject.userid, soundid: announcementObject.sound?.soundid ?? "" }, {
                                                onSuccess: () => {
                                                    announcementsQuery.refetch()
                                                    setShowAnnouncementDialog("none")
                                                }
                                            })}>{(showAnnouncementDialog === "create" ? "Create" : "Edit") + " Announcement"}</PositiveButton>
                                            <NegativeButton onClick={() => setShowAnnouncementDialog("none")}>Cancel</NegativeButton>
                                        </div>
                                    </div>}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* PAGE CONTENT */}
            <div className="w-full h-full">
                {announcementsQuery.isLoading && <p>Loading ...</p>}
                {announcementsQuery.data && !announcementsQuery.isError &&
                    <div className="flex flex-col grow h-full">
                        {announcementsQuery.data.announcements.length > 0 ?
                            <div className="overflow-x-auto grow h-full">
                                <table className="table-auto border border-collapse border-black dark:border-white m-1 divide-x">
                                    <thead className="border-b border-black dark:border-white">
                                        <tr>
                                            <th>User</th>
                                            <th>Sound</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-black dark:border-white">
                                        {announcementsQuery.data.announcements.map(announcement => (
                                            <tr className="divide-x border-black dark:border-white" key={announcement.userid}>
                                                <td className="p-2 border-black dark:border-white">{announcement.userid}</td>
                                                <td className="p-2 border-black dark:border-white">{announcement.sound.name}</td>
                                                <td className="p-2 border-black dark:border-white">
                                                    <div className="hidden md:flex flex-row gap-2">
                                                        <DefaultButton
                                                            onClick={() => deleteAnnouncement.mutate({ guildid: guildid, userid: announcement.userid }, { onSuccess: () => announcementsQuery.refetch() })}
                                                        >Delete</DefaultButton>
                                                        <DefaultButton onClick={() => {
                                                            dispatchAnnouncementAction({
                                                                type: "edit",
                                                                sound: announcement.sound,
                                                                userid: announcement.userid
                                                            })
                                                            setShowAnnouncementDialog("edit")
                                                        }}>Edit Sound</DefaultButton>
                                                    </div>
                                                    <div className="md:hidden">
                                                        <Menu as="div" className="relative inline-block text-left">
                                                            <div>
                                                                <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                                                                    Actions
                                                                    <ChevronDownIcon
                                                                        className="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"
                                                                        aria-hidden="true"
                                                                    />
                                                                </Menu.Button>
                                                            </div>
                                                            <Transition
                                                                as={Fragment}
                                                                enter="transition ease-out duration-100"
                                                                enterFrom="transform opacity-0 scale-95"
                                                                enterTo="transform opacity-100 scale-100"
                                                                leave="transition ease-in duration-75"
                                                                leaveFrom="transform opacity-100 scale-100"
                                                                leaveTo="transform opacity-0 scale-95"
                                                            >
                                                                <Menu.Items className="absolute right-0 mt-1 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-900 dark:text-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                                    <div className="p-1">
                                                                        <Menu.Item>
                                                                            <button className={`group flex w-full items-center rounded-md px-2 py-2 text-sm`} onClick={() => deleteAnnouncement.mutate({ guildid: guildid, userid: announcement.userid }, { onSuccess: () => announcementsQuery.refetch() })}>
                                                                                <TrashIcon className="h-5 w-5 mr-2" />
                                                                                Delete
                                                                            </button>
                                                                        </Menu.Item>
                                                                        <Menu.Item>
                                                                            <button className={`group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                                                                                <PencilSquareIcon className="h-5 w-5 mr-2" />
                                                                                Edit Sound
                                                                            </button>
                                                                        </Menu.Item>
                                                                    </div>

                                                                </Menu.Items>
                                                            </Transition>
                                                        </Menu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            :
                            <p>There seem to be no announcements. How about you create one?</p>
                        }
                    </div>
                }
            </div>

        </div >
    )
}

export default AnnouncementPage