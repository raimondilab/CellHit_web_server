import axios from 'axios';
import Swal from 'sweetalert2';

// Get task results
export async function getTaskResultsStep(task, step) {

    try {
        const query = {
            query: `
                query getResults {
                    getResults (taskId: "${task}", step: "${step}") {
                        taskId
                        status
                        result
                    }
                }
            `
        };

        const apiUrl = 'https://test.bioinfolab.sns.it/graphql';
        const taskData = await axios.post(apiUrl, query);

        if (!taskData.data.data || taskData.data.errors) {
            Swal.fire({
                icon: "error",
                text: "Oops... An error has occurred!"
            });
        } else if (taskData) {

            const taskID = taskData.data.data.getResults.taskId;
            const newStatus = taskData.data.data.getResults.status;
            const result = taskData.data.data.getResults.result;

            if (newStatus === "SUCCESS" && task === taskID && result) {
                return result;
            }
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            text: error.message
        });
    }

    return null;
}


// Get task results
export async function getDistribution(task, dicType, key) {

    try {
        const query = {
            query: `
                query getDistribution {
                    getDistribution (taskId: "${task}", dicType: "${dicType}", key: "${key}" ) {
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
            Swal.fire({
                icon: "error",
                text: "Oops... An error has occurred!"
            });
        } else if (taskData) {

            const taskID = taskData.data.data.getDistribution.taskId;
            const newStatus = taskData.data.data.getDistribution.status;
            const result = taskData.data.data.getDistribution.result;


            if (newStatus === "SUCCESS" && task === taskID && result) {
                return result;
            }
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            text: error.message
        });
    }

    return null;
}
