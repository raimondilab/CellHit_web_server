import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

const DataTypeDialog = ({ setSelectedType, isDialogVisible, setIsDialogVisible }) => {
    const [visible, setVisible] = useState(isDialogVisible);

    useEffect(() => {
        setVisible(isDialogVisible);
    }, [isDialogVisible]);

    const handleSelection = (type) => {
        setSelectedType(type);
        setVisible(false);
        setIsDialogVisible(false);
    };

    return (
        <Dialog
            visible={visible}
            onHide={() => {}}
            header="Input Type"
            draggable={false}
            resizable={false}
            style={{ width: '30rem' }}
            breakpoints={{ '960px': '75vw', '641px': '100vw' }}
            footer={
                <div className="flex justify-content-center gap-2">
                    <Button
                        label="Patient"
                        onClick={() => handleSelection('patient')}
                        className="w-8rem"
                    />
                    <Button
                        label="Cell Line"
                        outlined
                        onClick={() => handleSelection('celline')}
                        className="w-8rem"
                    />
                </div>
            }
        >
            <div className="flex flex-column align-items-center p-4 surface-overlay border-round">
                <span className="text-center">
                    Please select the type of input you are submitting. This is required for correct alignment during processing.
                </span>
            </div>
        </Dialog>
    );
};

export default DataTypeDialog;
