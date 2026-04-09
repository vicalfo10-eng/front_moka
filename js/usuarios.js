const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){

        window.location.href = "index.html"
        return

    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario

    // Evento para cargar los proveedores
    cargarRoles()

})

/* SIDEBAR COLLAPSE */

const toggleSidebar = () => {

    document.getElementById("sidebar")
    .classList.toggle("collapsed")

}

/* MENU EXPAND */
const toggleMenu = (element) => {

    const sidebar = document.getElementById("sidebar")

    if(sidebar.classList.contains("collapsed"))
    {
        sidebar.classList.remove("collapsed")
        return
    }

    const isActive = element.classList.contains("active")

        document.querySelectorAll(".menu-item").forEach(item=>{
        item.classList.remove("active")

    })

    if(!isActive)
        element.classList.add("active")
}

/* LOGOUT */
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

        categoria: document.getElementById("roleSelect").value,
        identificacion: document.getElementById("identificacion").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        contrasena: document.getElementById("contrasena").value.trim()
    }
}

const limpiarFormulario = () => {

    document.getElementById("formUsuarios").reset()
    editMode = false
}

const cargarRoles = async () => {

    const select = document.getElementById("roleSelect")

    try {

        const response = await fetch(`${API_URL}/roles`)
        const data = await response.json()

        if (!response.ok) {
            throw new Error("No se pudieron cargar los roles")
        }

        select.innerHTML = '<option value="">Seleccione un rol</option>'

        data.rol.forEach(rol => {
            const option = document.createElement("option")
            option.value = rol.id_rol
            option.textContent = rol.nombre
            select.appendChild(option)
        })

    } catch (error) {
        console.error("Error cargando roles:", error)
        select.innerHTML = '<option value="">Error al cargar roles</option>'
    }
}

const guardarProducto = async () => {

    const getData = getFormData()
    const estadoNumerico = (getData.estado === "activo") ? 1 : 0

    // Definimos los parámetros según el modo (Edición o Registro)
    const url = editMode ? `${API_URL}/user_update` : `${API_URL}/user_register`
    const metodo = editMode ? "PUT" : "POST"
    const mensaje = editMode ? "Actualización Exitosa" : "Registro Exitoso"

    try {

        const response = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_rol: getData.categoria,
                identificacion: getData.identificacion,
                nombre: getData.nombre,
                correo: getData.correo,
                contrasena: getData.contrasena,
                estado: estadoNumerico
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

        Swal.fire("Error", "Error al registrar el producto: " + error.message, "error") 
    }
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