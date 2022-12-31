import type { NextPage } from "next";
import { useRouter } from "next/router";
import { trpc } from "../../../../utils/trpc";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { useState } from "react";
import Head from "next/head";

enum DragError {
    TooManyFiles,
    InvalidType,
    InvalidFileType,
    Filesize
}

type NewSound = {
    name: string
    hidden: boolean
    file: File | null
}

function createNewSound(file: File): NewSound {
    return {
        name: file.name.slice(0, file.name.lastIndexOf(".")),
        hidden: false,
        file
    }
}

const MaxFileSize = 204800

const SoundsPage: NextPage = () => {
    const router = useRouter();
    const { guildid } = router.query
    const [dragging, setDragging] = useState(false)
    const [dragError, setDragError] = useState(null as DragError | null)
    const [newSound, setNewSound] = useState(null as NewSound | null)

    const sounds = trpc.discord.sounds.useQuery({ guildid: typeof guildid === "string" ? guildid : "" }, { enabled: typeof guildid === "string" })
    return (
        <div className="h-full w-full"
            onDragOver={event => {
                event.preventDefault()
            }}
            onDragEnter={ev => {
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
                setNewSound(createNewSound(file))
            }}
            onDragEnd={() => {
                setDragError(null)
                setDragging(false)
            }}
            onDragLeave={() => {
                setDragError(null)
                setDragging(false)
            }}
        >
            <Head>
                <title>
                    Sounds
                </title>
            </Head>
            <p>Sounds Page</p>
            {sounds.data &&
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
            {dragging && <p>DRAGGING!!!</p>}
            {dragError && <p>Drag Error {dragError}</p>}
        </div>

    )
}

export default SoundsPage