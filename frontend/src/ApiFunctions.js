import axios from 'axios';
import Swal from 'sweetalert2';

// Get task results
export async function getTaskResultsStep(task, step) {

    console.log(task, step)
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

        const apiUrl = 'https://api.cellhit.bioinfolab.sns.it/graphql';
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

            console.log(taskData)

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

