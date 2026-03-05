"use client"

import { Checkbox } from "../shadcn/checkbox"
import { Label } from "../shadcn/label"

interface CheckBoxProps<T extends { id: number | string, name: string }> {
    items: T[]
    selectedIds: (number | string)[]
    onSelectionChange: (selectedIds: (number | string)[]) => void
    className?: string
    variant?: 'default' | 'card'
}

export function CheckBox<T extends { id: number | string, name: string }>({
    items,
    selectedIds = [],
    onSelectionChange,
    className = "",
    variant = 'default'
}: CheckBoxProps<T>) {
    const handleToggle = (itemId: number | string) => {
        const newSelection = selectedIds.includes(itemId)
            ? selectedIds.filter(id => id !== itemId)
            : [...selectedIds, itemId]
        onSelectionChange(newSelection)
    }

    const renderCheckboxItem = (item: T) => {
        const isSelected = selectedIds.includes(item.id)

        if (variant === 'card') {
            return (
                <Label
                    key={item.id}
                    className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
                >
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                    />
                    <div className="grid gap-1.5 font-normal">
                        <p className="text-sm leading-none font-medium">
                            {item.name}
                        </p>
                    </div>
                </Label>
            )
        }

        // Default variant
        return (
            <div key={item.id} className="flex items-center space-x-3">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(item.id)}
                    id={`checkbox-${item.id}`}
                />
                <Label
                    htmlFor={`checkbox-${item.id}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                >
                    {item.name}
                </Label>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="border rounded-lg p-4">
                <div className={`space-y-3 ${variant === 'card' ? '' : 'flex flex-col gap-1'}`}>
                    {items.map(renderCheckboxItem)}
                </div>
            </div>
        </div>
    )
}
