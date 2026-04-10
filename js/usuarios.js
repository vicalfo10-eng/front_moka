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

        // Mostrar / ocultar contraseña
    document.querySelectorAll(".toggle-password").forEach(icon => {

        icon.addEventListener("click", () => {

            const input = icon.previousElementSibling

            if (input.type === "password") {

                input.type = "text"
                icon.classList.remove("fa-eye")
                icon.classList.add("fa-eye-slash")
            } else {

                input.type = "password"
                icon.classList.remove("fa-eye-slash")
                icon.classList.add("fa-eye")
            }

        })

    })

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

        identificacion: document.getElementById("identificacion").value.trim(),
        rol: document.getElementById("roleSelect").value,
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        contrasena: document.getElementById("contrasena").value.trim(),
        estado: document.querySelector('input[name="estado"]:checked').value
    }
}

const limpiarFormulario = () => {

    document.getElementById("formUsuarios").reset()
    
    const inputContrasena = document.getElementById("contrasena")
    inputContrasena.value = ""
    inputContrasena.disabled = false
    
    const iconoOjo = document.querySelector(".toggle-password")
    if (iconoOjo) iconoOjo.style.display = "block"

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

const buscarIdentificacion = async () => {

    const idInput = document.getElementById("identificacion").value.trim()

    if (!idInput) {
        return Swal.fire({
            title: "Información",
            text: "La identificación del usuario es obligatoria.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
    }
    
    try {

        // Llamada al API (Ajusta la URL según tu backend)
        const response = await fetch(`${API_URL}/user_register?identificacion=${idInput}`)
        const data = await response.json()

        if (data.ok) {

            document.getElementById("roleSelect").value = data.result.id_rol
            document.getElementById("identificacion").value = data.result.identificacion
            document.getElementById("nombre").value = data.result.nombre
            document.getElementById("correo").value = data.result.correo
            document.getElementById("contrasena").value = data.result.contrasena

            const inputContrasena = document.getElementById("contrasena")
            inputContrasena.disabled = true

            const iconoOjo = document.querySelector(".toggle-password");
            if (iconoOjo) {

                iconoOjo.style.display = "none";
            }

            if (data.result.activo === 1) {
                document.querySelector('input[name="estado"][value="activo"]').checked = true
            } else {
                document.querySelector('input[name="estado"][value="inactivo"]').checked = true
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

            limpiarFormulario()
        }
    } catch (error) {

        Swal.fire("Error", "Error al obtener el producto: " + error.message, "error")
    }
}

const guardarUsuario = async () => {

    const getData = getFormData()
    const estadoNumerico = (getData.estado === "activo") ? 1 : 0

    const url = editMode ? `${API_URL}/user_update` : `${API_URL}/user_register`
    const metodo = editMode ? "PUT" : "POST"
    const mensaje = editMode ? "Actualización Exitosa" : "Registro Exitoso"

    try {

        const response = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({

                identificacion: getData.identificacion,
                id_rol: getData.rol,
                nombre: getData.nombre,
                correo: getData.correo,
                contrasena: getData.contrasena,
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

        Swal.fire("Error", "Error al registrar el producto: " + error.message, "error") 
    }
}