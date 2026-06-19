const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){

        window.location.href = "index.html"
        return

    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario

});

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

    });

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
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        direccion: document.getElementById("direccion").value.trim(),
        estado: document.querySelector('input[name="estado"]:checked').value
    }
}

const limpiarFormulario = () => {

    document.getElementById("formProveedores").reset()
    document.getElementById("identificacion").value = ""
    document.getElementById("identificacion").disabled = false
    editMode = false
}

const abrirBusqueda = () => {

    document.getElementById("inputCriterioModal").value = document.getElementById("identificacion").value.trim()
    document.getElementById("modalBusqueda").style.display = "flex"
    document.getElementById("inputCriterioModal").focus()
    
    if (document.getElementById("inputCriterioModal").value !== "") {
        ejecutarBusqueda()
    }
}

const cerrarBusqueda = () => {

    document.getElementById("modalBusqueda").style.display = "none"
    document.getElementById("tablaResultadosModalBody").innerHTML = `
        <tr><td colspan="4" class="text-center">Escriba un criterio y presione Filtrar.</td></tr>
    `
}

const ejecutarBusqueda = async () => {

    const idInput = document.getElementById("inputCriterioModal").value.trim()
    const tbody = document.getElementById("tablaResultadosModalBody")
    
    tbody.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa fa-spinner fa-spin"></i> Buscando...</td></tr>`

    try {
        const response = await fetch(`${API_URL}/supplier_register?term=${encodeURIComponent(idInput)}`)
        const data = await response.json()

        if (data.ok && data.result) {

            tbody.innerHTML = ""
            
            const resultados = Array.isArray(data.result) ? data.result : [data.result]

            if (resultados.length === 1 && resultados[0].ok === 0) {

                tbody.innerHTML = `<tr><td colspan="4" class="text-center">${resultados[0].msg || 'No se encontraron resultados.'}</td></tr>`
                return
            }

            resultados.forEach(cat => {

                const badgeEstado = cat.activo === 1 
                    ? `<span class="badge badge-active">Activo</span>` 
                    : `<span class="badge badge-inactive" style="background-color:#95a5a6; color:#fff; padding:2px 8px; border-radius:4px;">Inactivo</span>`

                const tr = document.createElement("tr")
                tr.className = "tr-clickable"
                
                // Envío de datos limpios a los inputs del mantenimiento principal
                tr.onclick = () => seleccionarRegistro(cat.identificacion, cat.nombre, cat.telefono, cat.correo, cat.direccion, cat.activo)
                
                tr.innerHTML = `
                    <td class="text-center"><strong>${cat.identificacion}</strong></td>
                    <td>${cat.nombre}</td>
                    <td class="text-center">${badgeEstado}</td>
                `
                tbody.appendChild(tr)
            })
        } else {

            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No se encontraron resultados válidos.</td></tr>`
        }
    } catch (error) {

        console.error("Error exacto en la renderización del modal:", error) // Nos ayuda a diagnosticar en consola
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al procesar la información del servidor.</td></tr>`
    }
}

const seleccionarRegistro = (identificacion, nombre, telefono, correo, direccion, activo) => {

    document.getElementById("identificacion").disabled = true

    document.getElementById("identificacion").value = identificacion
    document.getElementById("nombre").value = nombre
    document.getElementById("telefono").value = telefono
    document.getElementById("correo").value = correo
    document.getElementById("direccion").value = direccion

    if (activo === 1) {
        document.querySelector('input[name="estado"][value="activo"]').checked = true
    } else {
        document.querySelector('input[name="estado"][value="inactivo"]').checked = true
    }

    editMode = true
    cerrarBusqueda()
}

/**
 * Función que decide si Guardar o Actualizar
 */
const guardarProveedor = async () => {

    const getData = getFormData()
    const estadoNumerico = (getData.estado === "activo") ? 1 : 0

    // Definimos los parámetros según el modo (Edición o Registro)
    const url = editMode ? `${API_URL}/supplier_update` : `${API_URL}/supplier_register`
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
                direccion: getData.direccion,
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

        Swal.fire("Error", "Error al registrar el proveedor: " + error.message, "error")       
    }
}

const eliminarProveedor = () => {

    const id = document.getElementById("identificacion").value.trim()

    if (!id) {
        return Swal.fire({
            title: "Información",
            text: "El número de identificación es obligatorio.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
    }

    // Usamos tu función de confirmación con el color morado de MOKA
    confirmarAccion("¿Está seguro de eliminar el proveedor?", async () => {

        try {
            const response = await fetch(`${API_URL}/supplier_delete?identificacion=${id}`, {
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