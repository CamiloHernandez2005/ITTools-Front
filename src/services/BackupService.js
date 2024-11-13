import axios from 'axios';

export const BackupService = {
    async getAllBackupInfo() {
        try {
            const response = await axios.get('/api/database/allBackupInfo');
            return response.data;
        } catch (error) {
            console.error("Error fetching backup info:", error);
            throw error;
        }
    }
};
