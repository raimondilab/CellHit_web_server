import React, { useState, useEffect, useRef } from 'react';
import { Timeline } from 'primereact/timeline';
import { Message } from 'primereact/message';
import HeaderTitleRunCellHit from '../../components/HeaderTitleRunCellHit/HeaderTitleRunCellHit';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Button } from 'primereact/button';


const ProgressionRun = ({ taskID, statusTask, setTaskStatus, setIsSubmit, alignOnly }) => {

    const navigate = useNavigate();
    const currentEventColor = "#FF9800";
    const successEventColor = "#4CAF50";

    const [text, setText] = useState("");
    const [highlightedEvents, setHighlightedEvents] = useState([]);
    const [taskStatus, setTaskStatusState] = useState(statusTask);
    const [completionMessage, setCompletionMessage] = useState("");
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

   const baseEvents = [
    { status: 'Data sending', date: '15/10/2020 10:30', icon: 'pi pi-send', color: '#607D8B' },
    { status: 'Queueing', date: '16/10/2020 10:00', icon: 'pi pi-clock', color: '#607D8B' }, // New event
    { status: 'Processing', date: '15/10/2020 14:00', icon: 'pi pi-cog', color: '#607D8B' },
    { status: 'Batch correction', date: '16/10/2020 10:00', icon: 'pi pi-wrench', color: '#607D8B' },
    { status: 'Imputation', date: '16/10/2020 10:00', icon: 'pi pi-microchip-ai', color: '#607D8B' },
    { status: 'Transform', date: '16/10/2020 10:00', icon: 'pi pi-objects-column', color: '#607D8B' },
    { status: 'Inference', date: '16/10/2020 10:00', icon: 'pi pi-lightbulb', color: '#607D8B' },
    { status: 'Results elaboration', date: '16/10/2020 10:00', icon: 'pi pi-chart-scatter', color: '#607D8B' }
];

    const statusInterval = useRef(null);

     const expirationDate = new Date();
                    expirationDate.setMonth(expirationDate.getMonth() + 1);

     const formattedDate = expirationDate.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    });


    useEffect(() => {
        setText(`We are conducting intensive tasks that may take up to a few minutes to process. If you want to avoid waiting for the results, please copy the task ID below and return later. \n TaskID: ${taskID}`);
    }, [taskID]);

   useEffect(() => {
    const indexOfCurrentTask = baseEvents.findIndex(event => event.status === statusTask);

    let updatedEvents = baseEvents.map((event, index) => ({
        ...event,
        color: index <= indexOfCurrentTask ? currentEventColor : event.color,
    }));

    // Apply conditional removals
    const shouldHideInference = alignOnly === "ON";
    const shouldHideQueueing = statusTask !== "Queueing";

    updatedEvents = updatedEvents.filter(event => {
        if (event.status === "Inference" && shouldHideInference) return false;
        if (event.status === "Queueing" && shouldHideQueueing) return false;
        return true;
    });

    setHighlightedEvents(updatedEvents);
}, [statusTask, alignOnly]);



    const customizedEvents = (item) => {
        return (
            <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color }}>
                <i className={item.icon}></i>
            </span>
        );
    };

    const customizedContent = (item) => {
        return (
            <div>
                <p className="mb-1">{item.status}</p>
                {item.status === 'Results elaboration' && completionMessage && (
                    <p style={{ fontStyle: 'italic', color: '#757575', marginTop: '0px' }}>{completionMessage}</p>
                )}
            </div>
        );
    };

    const handleEnableNotifications = () => {
    if (notificationsEnabled) {
        // Disable notifications
        setNotificationsEnabled(false);
        Swal.fire({
            icon: "info",
            text: "Notifications disabled!"
        });
    } else {
        // Enable notifications
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    setNotificationsEnabled(true);
                    Swal.fire({
                        icon: "success",
                        text: "Notifications enabled successfully!"
                    });
                } else {
                    setNotificationsEnabled(false);
                    Swal.fire({
                        icon: "warning",
                        text: "Notifications are blocked. Please enable them in your browser settings."
                    });
                }
            });
        } else {
            Swal.fire({
                icon: "error",
                text: "Browser does not support notifications."
            });
        }
    }
};

    const showNotification = (formattedDate) => {
         console.log("Notifications Enabled:", notificationsEnabled);
        if (notificationsEnabled && "Notification" in window) {
            new Notification("Task Complete", {
                body: `Your task has been completed successfully! Results will be stored until ${formattedDate}.`
            });
        }
    };

    async function getTaskStatus() {
        try {
            const query = {
                query: `
                    query getTask {
                        getResults (taskId: "${taskID}", step: "umap") {
                            taskId
                            status
                            result
                        }
                    }
                `
            };

            const apiUrl = 'https://api.cellhit.bioinfolab.sns.it/graphql';
            const taskData = await axios.post(apiUrl, query);

            if (!taskData.data.data || taskData.data.errors) {
                    clearInterval(statusInterval.current);

                    Swal.fire({
                        icon: "error",
                        text: "Oops... An error has occurred!"
                    });

                setIsSubmit(false);

            } else if (taskData) {

                const taskID = taskData.data.data.getResults.taskId;
                const newStatus = taskData.data.data.getResults.status;
                const result = taskData.data.data.getResults.result;

                if (newStatus === "FAILURE") {

                     clearInterval(statusInterval.current);
                      setIsSubmit(false);

                        Swal.fire({
                            icon: "error",
                            text: taskID
                        });

                }

                if (newStatus !== "SUCCESS") {
                    setTaskStatusState(newStatus);
                    setTaskStatus(newStatus);
                }

                // Set status when task waiting the process
                if (taskID === "PENDING") {
                    setTaskStatusState('Queueing');
                    setTaskStatus('Queueing');
                }
                    console.log(newStatus)
                 if (newStatus === 'Processing') {
                   console.log(formattedDate, newStatus)
                   setCompletionMessage(`Results will be stored until ${formattedDate}.`);
                 }

                if (newStatus === "SUCCESS") {

                    showNotification(formattedDate);
                    clearInterval(statusInterval.current);

                    const url = new URL(window.location.href);
                    url.searchParams.set('taskId', taskID);

                    const targetRoute = alignOnly === "ON" ? '/resultAlign/' : '/result/';
                    navigate(targetRoute + url.search, { state: { taskID: taskID, data: result } });
                }

            }
        } catch (error) {
            clearInterval(statusInterval.current);
            setIsSubmit(false);
            Swal.fire({
                icon: "error",
                text: error.message
            });
        }
    }

    useEffect(() => {
        statusInterval.current = setInterval(() => {
            getTaskStatus();
        }, 3000);

        return () => clearInterval(statusInterval.current);
    }, []);

    return (
        <>
            <HeaderTitleRunCellHit />
            <div className="row mb-3">
              <div className="col-md-3">
                <Button label={notificationsEnabled ? "Turn notification off" : "Turn notification on"}
                        icon= {notificationsEnabled ? "pi pi-bell-slash" : "pi pi-bell"}
                        onClick={handleEnableNotifications} />
               </div>
            </div>
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
