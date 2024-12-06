import axios from 'axios';

export const LogShipping= {
    async getAllBackupInfo() {
        try {
            const response = await axios.get('/log-shipping/status');
            return response.data;
        } catch (error) {
            console.error("Error fetching backup info:", error);
            throw error;
        }
    }
};
