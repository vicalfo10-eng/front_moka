const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if (!usuario) {
        window.location.href = "index.html"
        return
    }

    // document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario
})

/* --- FUNCIONES EXISTENTES --- */
const toggleSidebar = () => {

    document.getElementById("sidebar").classList.toggle("collapsed")
}

const toggleMenu = (element) => {

    const sidebar = document.getElementById("sidebar");

    if (sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed")
    }

    const isActive = element.classList.contains("active");
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active")
    })

    if (!isActive) element.classList.add("active")
}

const logout = () => {

    localStorage.removeItem("codigo")
    localStorage.removeItem("usuario")
    window.location.href = "index.html"
}

// Variable para controlar si estamos editando
let editMode = false

/**
 * Obtiene los datos del formulario de forma limpia
 */
const getFormData = () => {

    return {

        identificacion: document.getElementById("identificacion").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        estado: document.querySelector('input[name="estado"]:checked').value
    }
}

const limpiarFormulario = () => {

    document.getElementById("formClientes").reset()
    editMode = false
}

/**
 * Lógica de Búsqueda
 */
const buscarCliente = async () => {

    const idInput = document.getElementById("identificacion").value.trim()

    if (!idInput) {
        return Swal.fire({
            title: "Información",
            text: "El número de identificación es obligatorio.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
    }
    
    try {

        // Llamada al API (Ajusta la URL según tu backend)
        const response = await fetch(`${API_URL}/customer_register?identificacion=${idInput}`)
        const data = await response.json()

        if (data.ok) {

            document.getElementById("nombre").value = data.result.nombre;
            document.getElementById("telefono").value = data.result.telefono;
            document.getElementById("correo").value = data.result.correo;

            if (data.result.activo === 1) {
                document.querySelector('input[name="estado"][value="activo"]').checked = true;
            } else {
                document.querySelector('input[name="estado"][value="inactivo"]').checked = true;
            }

            editMode = true // Activamos modo edición

        } else {

            editMode = false // No se encontró, modo nuevo registro

            Swal.fire({
                title: "Información",
                text: data.result.msg,
                icon: "info",
                confirmButtonColor: '#17a2b8'
            })
        }
    } catch (error) {

        Swal.fire("Error", "Error al obtener el cliente: " + error.message, "error")
    }
}

/**
 * Función que decide si Guardar o Actualizar
 */
const guardarCliente = async () => {

    const getData = getFormData()
    const estadoNumerico = (getData.estado === "activo") ? 1 : 0

    // Definimos los parámetros según el modo (Edición o Registro)
    const url = editMode ? `${API_URL}/customer_update` : `${API_URL}/customer_register`
    const metodo = editMode ? "PUT" : "POST"
    const mensaje = editMode ? "Actualización Exitosa" : "Registro Exitoso"

    try {

        const response = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identificacion: getData.identificacion,
                nombre: getData.nombre,
                telefono: getData.telefono,
                correo: getData.correo,
                activo: estadoNumerico
            })
        })
        
        const data = await response.json()

        if (data.empty) { 
            Swal.fire({
                title: "Información",
                text: data.data.errors[0].msg,
                icon: "info",
                confirmButtonColor: '#17a2b8'
            })
            return
        }

        if (!data.ok) {
            Swal.fire({
                title: "Atención",
                text: data.msg,
                icon: "error",
                confirmButtonColor: '#e74c3c'
            })
            return
        }

        Swal.fire({
            title: mensaje,
            text: data.msg,
            icon: "success",
            confirmButtonColor: '#00B3A4'
        })

        limpiarFormulario() // limpiar formulario

    } catch (error) {

        Swal.fire("Error", "Error al registrar cliente: " + error.message, "error")       
    }
}

const eliminarCliente = () => {

    const id = document.getElementById("identificacion").value.trim();

    if (!id) {
        return Swal.fire({
            title: "Información",
            text: "El número de identificación es obligatorio.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
    }

    // Usamos tu función de confirmación con el color morado de MOKA
    confirmarAccion("¿Está seguro de eliminar este cliente?", async () => {

        try {
            const response = await fetch(`${API_URL}/customer_delete?identificacion=${id}`, {
                method: "DELETE"
            })

            const data = await response.json()

            if (data.ok) {
                Swal.fire({
                    title: "Eliminado",
                    text: data.result.msg,
                    icon: "success",
                    confirmButtonColor: '#00B3A4'
                })

                limpiarFormulario()

            } else {

                // Aquí entrará si el SP detectó que tiene ventas (Status 400)
                Swal.fire({
                    title: "No se puede eliminar",
                    text: data.result.msg,
                    icon: "error",
                    confirmButtonColor: '#e74c3c'
                })
            }
        } catch (error) {

            Swal.fire("Error", "No se pudo conectar con el servidor", "error")
        }
    })
}

/**
 * Modal de confirmación genérico (Usando SweetAlert2)
 */
const confirmarAccion = (mensaje, callback) => {

    Swal.fire({
        title: '¿Estás seguro?',
        text: mensaje,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c', // Morado MOKA
        cancelButtonColor: '#95a5a6',
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'

    }).then((result) => {

        if (result.isConfirmed) {
            // Verificamos que el callback exista y sea una función
            if (callback && typeof callback === 'function') {
                callback()
            }
        }
    })
}