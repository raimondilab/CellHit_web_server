import React, { useState, useEffect } from 'react';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import HeaderTitleRunCellHit from '../../components/HeaderTitleRunCellHit/HeaderTitleRunCellHit';
import { Message } from 'primereact/message';

const ProgressionRun = ({ taskID }) => {
    const currentEventColor = "#FF9800";

    const [text, setText] = useState("");

    // Update the text only once when the component mounts
    useEffect(() => {
        setText(`We are conducting intensive tasks that may take up to five minutes to process. If you want to avoid waiting for the results, please copy the task ID below and return later. \n TaskID: ${taskID}`);
    }, [taskID]);

    const events = [
        { status: 'Data sending', date: '15/10/2020 10:30', icon: 'pi pi-send', color: '#607D8B' },
        { status: 'Processing', date: '15/10/2020 14:00', icon: 'pi pi-cog', color: '#607D8B' },
        { status: 'Classification', date: '15/10/2020 16:15', icon: 'pi pi-check-circle', color: '#607D8B' },
        { status: 'Batch correction', date: '16/10/2020 10:00', icon: 'pi pi-wrench', color: '#607D8B' },
        { status: 'Imputation', date: '16/10/2020 10:00', icon: 'pi pi-microchip-ai', color: '#607D8B' },
        { status: 'Transform', date: '16/10/2020 10:00', icon: 'pi pi-objects-column', color: '#607D8B' },
        { status: 'Inference', date: '16/10/2020 10:00', icon: 'pi pi-chart-line', color: '#607D8B' }
    ];

    const customizedEvents = (item) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color }}>
                <i className={item.icon}></i>
            </span>
        );
    };

    const customizedContent = (item) => {
        return (
            <p className="mt-2">{item.status}</p>
        );
    };

    return (
        <>
            <HeaderTitleRunCellHit />
            <div className="row">
                <div className="col-md-12 mb-4">
                    <Message className="col-md-12 display-1" severity="info" text={text} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <Timeline value={events} align="alternate" className="customized-timeline" marker={customizedEvents} content={customizedContent} />
                </div>
            </div>
        </>
    );
};

export default ProgressionRun;
