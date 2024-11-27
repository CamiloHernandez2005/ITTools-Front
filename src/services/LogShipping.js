import axios from 'axios';

export const LogShipping= {
    async getAllBackupInfo() {
        try {
            const response = await axios.post('/logshipping/check');
            return response.data;
        } catch (error) {
            console.error("Error fetching backup info:", error);
            throw error;
        }
    }
};
