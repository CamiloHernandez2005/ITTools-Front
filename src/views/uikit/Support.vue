<script>
import { ref } from 'vue';
import Breadcrumb from 'primevue/breadcrumb';
import logo1 from '@/assets/emida-image.png';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

export default {
    components: {
       Breadcrumb,
       Button,
       InputText,
       Textarea
    },
    setup() {
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Support', icon: 'pi pi-user', route: { name: 'Support' } }
        ]);

        // Campos de contacto
        const firstName = ref('');
        const lastName = ref('');
        const email = ref('');
        const subject = ref('');
        const message = ref('');

        // Método para manejar el envío del formulario
        const submitForm = () => {
            console.log({
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value,
                subject: subject.value,
                message: message.value,
            });
            // Aquí podrías hacer una llamada API para enviar el formulario
            alert('Formulario enviado');
        };

        return {
            breadcrumbItems,
            firstName,
            lastName,
            email,
            subject,
            message,
            submitForm,
            logo1
        };
    }
}
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <!-- Contenido con la imagen y el formulario de contacto -->
        <div class="card p-6 flex flex-col shadow-custom border">
            <!-- Agrupar los dos elementos: titulo y breadcrumb -->
            <div class="header-container">
                <div class="title font-semibold text-xl">Support</div>
                <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
            </div>

            <!-- Sección que agrupa imagen y formulario -->
            <div class="flex flex-grow">
                <!-- Columna izquierda con la imagen -->
                <div class="w-1/3 p-4">
                    <img :src="logo1" alt="Company Logo" class="w-full h-auto" />
                </div>

                <!-- Columna derecha con el formulario de contacto -->
                <div class="w-2/3 p-4">
                    <div class="form-container">
                        <h2 class="text-2xl font-semibold mb-4">Contact us</h2>
                        <form @submit.prevent="submitForm">
                            <!-- Fila con First Name y Last Name -->
                            <div class="flex mb-4">
                                <div class="w-1/2 mr-4">
                                    <label for="firstName" class="block text-sm font-medium">First name</label>
                                    <InputText type="text" id="firstName" v-model="firstName" class="input-field input-with-line" placeholder="Enter your first name" required />
                                </div>
                                <div class="w-1/2">
                                    <label for="lastName" class="block text-sm font-medium">Last name</label>
                                    <InputText type="text" id="lastName" v-model="lastName" class="input-field input-with-line" placeholder="Enter your last name" required />
                                </div>
                            </div>

                            <!-- Fila con Email y Subject -->
                            <div class="flex mb-4">
                                <div class="w-1/2 mr-4">
                                    <label for="email" class="block text-sm font-medium">Email</label>
                                    <InputText type="email" id="email" v-model="email" class="input-field input-with-line" placeholder="Enter your email" required />
                                </div>
                                <div class="w-1/2">
                                    <label for="subject" class="block text-sm font-medium">Subject</label>
                                    <InputText type="text" id="subject" v-model="subject" class="input-field input-with-line " placeholder="Enter the subject" required />
                                </div>
                            </div>

                            <!-- Campo Message en una fila completa -->
                            <div class="mb-4">
                                <label for="message" class="block text-sm font-medium">Message</label>
                                <Textarea id="message" v-model="message" rows="1" class="input-field input-with-line " placeholder="Enter your message" required></textarea>
                            </div>

                            <div class="flex justify-end mt-4">
                                <Button type="submit" id="create-button" class="submit-btn">Submit</Button>
                            </div>
                            <!-- Botón de envío -->
                           
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -1rem;
}

/* Imagen */
img {
    border-radius: 8px;
}

/* Estilos del formulario */
.input-field {
    width: 100%;
    padding: 8px;
    margin-top: 4px;
    border: 1px solid #ccc;
    border-radius: 4px;
}


#create-button {
  background: #64c4ac;
  color: white;
  border-color: #64c4ac;
}

#create-button:hover {
  background: white;
  color: #64c4ac;
  border-color: #64c4ac;
}

.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db; /* Línea gris clara */
    padding: 0.5rem 0.4rem;
    background: transparent; /* Fondo transparente */
    outline: none;
    box-shadow: none;
    margin-bottom: 0.5rem;
}
.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px; /* Opcional: redondear bordes */
}
</style>
