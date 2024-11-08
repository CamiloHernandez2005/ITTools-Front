import axios from '../axios';

export const AuditDatabaseService = {
 
    

    async getAllAuditsDatabase(){
    
        const response = await axios.get('audits/auditdatabases');
        return response.data;
      
    }

    }