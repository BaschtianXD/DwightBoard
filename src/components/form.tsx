import { Listbox } from "@headlessui/react"
import { ChangeEventHandler, FC, MouseEventHandler, ReactNode, useId } from "react"

type TextInputProps = {
    label?: string
    value?: string
    onChange?: ChangeEventHandler<HTMLInputElement>
    key?: string
    disabled?: boolean
}

export const TextInput: FC<TextInputProps> = (props) => {
    const id = useId()
    return (
        <div className="w-full flex flex-row items-center gap-2">
            <label className="font-semibold" htmlFor={id} >{props.label}</label>
            <input
                id={id}
                className="bg-transparent rounded-lg ring-1 ring-gray-500 focus-visible:ring-2 focus-visible:ring-offset-1 p-1 grow focus-visible:outline-none"
                type="text"
                onChange={props.onChange}
                value={props.value}
                key={props.key}
                disabled={props.disabled}
            />
        </div>

    )
}

type SelectInputProps = {
    label?: string
    value?: string
    buttonText?: string
    onChange?: ChangeEventHandler<HTMLSelectElement>
    options: { key: string, text: string }[]
    placeholder?: string
}

export const SelectInput: FC<SelectInputProps> = (props) => {

    const optionsTags = props.options.map(option => <option key={option.key}>{option.text}</option>)
    if (props.placeholder) {
        optionsTags.unshift(<option key="" disabled>{props.placeholder}</option>)
    }
    return (
        <div className="w-full flex flex-row items-center gap-2">
            <label className="font-semibold">{props.label}</label>
            <Listbox value>
                <Listbox.Button>{props.buttonText}</Listbox.Button>
                <Listbox.Options>
                    {props.placeholder && <Listbox.Option key="" value="" disabled>{props.placeholder}</Listbox.Option>}
                    {props.options.map(option => (
                        <Listbox.Option key={option.key} value={option.key}>{option.text}</Listbox.Option>
                    ))}
                </Listbox.Options>

            </Listbox>
        </div>
    )
}

type ButtonProps = {
    onClick?: MouseEventHandler<HTMLButtonElement>
    children?: ReactNode
    disabled?: boolean
}

export const DefaultButton: FC<ButtonProps> = (props) => {
    return (
        <button
            onClick={props.onClick}
            className="inline-flex justify-center rounded-md bg-gray-500 bg-opacity-60 dark:bg-opacity-40 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
            disabled={props.disabled}
        >
            {props.children}
        </button>
    )
}

export const PositiveButton: FC<ButtonProps> = (props) => {
    return (
        <button
            onClick={props.onClick}
            className={`inline-flex justify-center rounded-md bg-green-500 bg-opacity-70 px-4 py-2 text-sm font-medium ${props.disabled ? "text-white/50" : "text-white"} ${!props.disabled && "hover:bg-opacity-30"} focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            disabled={props.disabled}
        >
            {props.children}
        </button>
    )
}

export const NegativeButton: FC<ButtonProps> = (props) => {
    return (
        <button
            onClick={props.onClick}
            className={`inline-flex justify-center rounded-md bg-red-500 bg-opacity-70 px-4 py-2 text-sm font-medium ${props.disabled ? "text-white/50" : "text-white"} ${!props.disabled && "hover:bg-opacity-30"} focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            disabled={props.disabled}
        >
            {props.children}
        </button>
    )
}

type LoadingIconProps = {
    className?: string
}

export const LoadingIcon: FC<LoadingIconProps> = (props) => {
    return (

        <svg className={"animate-spin " + props.className} viewBox="0 0 100 100">
            <path strokeWidth={10} stroke="white" fillOpacity={0} d="M5,50 a40,40 0 0,1 40,-40" />
        </svg>
    )
}