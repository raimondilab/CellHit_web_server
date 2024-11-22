import React, { useState, useEffect, useRef } from 'react';
import { Timeline } from 'primereact/timeline';
import { Message } from 'primereact/message';
import HeaderTitleRunCellHit from '../../components/HeaderTitleRunCellHit/HeaderTitleRunCellHit';
import Swal from 'sweetalert2';
import axios from 'axios';
import {useNavigate} from "react-router-dom";

const ProgressionRun = ({ taskID, statusTask, setTaskStatus }) => {
    const navigate = useNavigate();
    const currentEventColor = "#FF9800";

    const [text, setText] = useState("");
    const [highlightedEvents, setHighlightedEvents] = useState([]);
    const [taskStatus, setTaskStatusState] = useState(statusTask);

    const baseEvents = [
        { status: 'Data sending', date: '15/10/2020 10:30', icon: 'pi pi-send', color: '#607D8B' },
        { status: 'Processing', date: '15/10/2020 14:00', icon: 'pi pi-cog', color: '#607D8B' },
        { status: 'Classification', date: '15/10/2020 16:15', icon: 'pi pi-check-circle', color: '#607D8B' },
        { status: 'Batch correction', date: '16/10/2020 10:00', icon: 'pi pi-wrench', color: '#607D8B' },
        { status: 'Imputation', date: '16/10/2020 10:00', icon: 'pi pi-microchip-ai', color: '#607D8B' },
        { status: 'Transform', date: '16/10/2020 10:00', icon: 'pi pi-objects-column', color: '#607D8B' },
        { status: 'Inference', date: '16/10/2020 10:00', icon: 'pi pi-chart-line', color: '#607D8B' }
    ];

    const statusInterval = useRef(null); // Use useRef to store the interval

    // Update the text only once when the component mounts
    useEffect(() => {
        setText(`We are conducting intensive tasks that may take up to five minutes to process. If you want to avoid waiting for the results, please copy the task ID below and return later. \n TaskID: ${taskID}`);
    }, [taskID]);

    // Update event colors based on statusTask
    useEffect(() => {
        const indexOfCurrentTask = baseEvents.findIndex(event => event.status === statusTask);
        const updatedEvents = baseEvents.map((event, index) => ({
            ...event,
            color: index <= indexOfCurrentTask ? currentEventColor : event.color,
        }));
        setHighlightedEvents(updatedEvents);
    }, [statusTask]);

    // Customized event rendering
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

    // Get task status
    async function getTaskStatus() {
        try {
            const query = {
                query: `
                    query getTask {
                        getTask (taskId: "${taskID}") {
                            status
                        }
                    }
                `
            };

            const apiUrl = 'http://127.0.0.1:8003/graphql';
            const taskData = await axios.post(apiUrl, query);

            if (!taskData) {
                Swal.fire({
                    icon: "info",
                    text: "No results found!"
                });
                return;
            } else if (taskData.data.errors) {
                Swal.fire({
                    icon: "error",
                    text: "Oops... \n An error has occurred!"
                });
                return;
            } else if (taskData) {
                const newStatus = taskData.data.data.getTask.status;

                if (newStatus !== "SUCCESS"){

                    setTaskStatusState(newStatus);
                    setTaskStatus(newStatus);

                }

                // If the status is "SUCCESS", clear the interval to stop checking
                if (newStatus === "SUCCESS") {
                    clearInterval(statusInterval.current);

                    // Append the form values as query parameters to the URL
                    const url = new URL(window.location.href);
                    url.searchParams.set('taskId', taskID);

                    // Navigate to result page
                    navigate('/result/' + url.search, { state: { taskID: taskID } });
                }

            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                text: error.message
            });
        }
    }

    useEffect(() => {
        // Call getTaskStatus every 2 seconds until status is "Inference"
        statusInterval.current = setInterval(() => {
            getTaskStatus();
        }, 2000);

        // Clear interval on component unmount
        return () => clearInterval(statusInterval.current);
    }, []);

    return (
        <>
            <HeaderTitleRunCellHit />
            <div className="row">
                <div className="col-md-12 mb-4">
                    <Message className="col-md-12 display-1 line-height-message" severity="info" text={text} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-12">
                    <Timeline value={highlightedEvents} align="alternate" className="customized-timeline" marker={customizedEvents} content={customizedContent} />
                </div>
            </div>
        </>
    );
};

export default ProgressionRun;
