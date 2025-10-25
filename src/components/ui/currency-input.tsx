
"use client";

import * as React from "react";
import { NumericFormat, type NumberFormatValues, type NumericFormatProps } from 'react-number-format';
import { Input } from "@/components/ui/input";

// Omit conflicting props from the base HTML input attributes
type BaseInputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>, 
    'value' | 'defaultValue' | 'onChange' | 'type'
>;

// Define the custom props for our CurrencyInput, ensuring they match what NumericFormat expects
export interface CurrencyInputProps extends BaseInputProps {
    value?: number | string | null;
    defaultValue?: number | string | null;
    onValueChange?: (values: NumberFormatValues) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ onValueChange, ...props }, ref) => {
        return (
            <NumericFormat
                {...props}
                type="text"
                onValueChange={onValueChange}
                customInput={Input}
                thousandSeparator=","
                prefix="₱ "
                decimalScale={2}
                getInputRef={ref}
            />
        );
    }
);
CurrencyInput.displayName = "CurrencyInput";
