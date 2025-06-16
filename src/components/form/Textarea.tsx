import {
	Controller,
	type FieldValues,
	type RegisterOptions,
	useForm,
} from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useRef } from "react";
import type { InputProps } from "./Input";

export default function Textarea({
	label,
	validation,
	onUpdate,
	name,
	value,
	...rest
}: Omit<InputProps, 'password'>) {
	const myForm = useMyForm();
	const input = useRef(null);

	useEffect(() => {
		myForm.setValue &&
			value &&
			myForm.setValue(name, value, {
				shouldValidate: true,
				shouldDirty: true,
			});
	}, [value]);

	const watchInput = myForm.watch(name, value);

	useEffect(() => {
		onUpdate && watchInput != undefined && onUpdate(watchInput);
	}, [watchInput]);

	return (
		<div className="flex flex-col gap-1">
			{label ? (
				<span className={`text-base ${validation?.required && "required"}`}>
					{label}
				</span>
			) : null}
			<div className="flex overflow-hidden gap-2 bg-gray-1 rounded-2xl h-[9rem]">
				<textarea
					{...rest}
					className="p-4 placeholder:opacity-50 placeholder:font-normal focus:outline-none h-full font-bold text-base w-full rounded-2xl"
					defaultValue={value}
					{...myForm.register(name, validation)}
				/>
				{rest?.right && <>{rest?.right}</>}
			</div>
			{myForm?.errors?.[name]?.message && (
				<span className="text-danger ml-1 text-xs">
					{myForm?.errors?.[name]?.message}
				</span>
			)}
		</div>
	);
}
