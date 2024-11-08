import axios from '../axios';

export const AuditService = {
 
    async getAllAudits(){
    
        const response = await axios.get('audits');
        return response.data;
      
    }
    }


