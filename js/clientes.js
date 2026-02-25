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

    localStorage.removeItem("usuario")
    window.location.href = "index.html"
}

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
}

/**
 * Lógica de Búsqueda
 */
/*async function buscarCliente() {

    const idInput = document.getElementById("identificacion");
    
    if (!idInput.value) {
        Swal.fire("Atención", "Por favor ingrese una identificación para buscar", "warning");
        return;
    }

    try {
        // Simulación de llamado al API
        // const response = await fetch(`api/clientes/${idInput.value}`);
        const data = null; // Simular que no hay datos para el ejemplo

        if (data) {
            document.getElementById("nombre").value = data.nombre;
            document.getElementById("telefono").value = data.telefono;
            document.getElementById("correo").value = data.correo;
            // Marcar estado según data.estado...
            editMode = true;
            Swal.fire("Cliente Encontrado", "Datos cargados correctamente", "success");
        } else {
            editMode = false;
            Swal.fire({
                title: "Información",
                text: "No se encontró ningún cliente. Puede proceder a crear uno nuevo.",
                icon: "info",
                confirmButtonColor: '#7B3F8C'
            });
        }
    } catch (error) {
        Swal.fire("Error", "Error de conexión con el servidor", "error");
    }
}*/

/**
 * Función que decide si Guardar o Actualizar
 */
const guardarCliente = async () => {

    const getData = getFormData();
    const estadoNumerico = (getData.estado === "activo") ? 1 : 0;
    try {

        const response = await fetch(`${API_URL}/customer_register`, {
            method: "POST",
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
            title: "Registro Exitoso",
            text: "Cliente guardado correctamente",
            icon: "success",
            confirmButtonColor: '#00B3A4'
        })

        limpiarFormulario() // limpiar formulario

    } catch (error) {

        Swal.fire("Error", "Error al registrar cliente: " + error.message, "error")       
    }
}

/*async function eliminarCliente() {
    const id = document.getElementById("identificacion").value;
    if (!id) return Swal.fire("Error", "Debe buscar un cliente primero", "error");

    confirmarAccion("¿Está seguro de eliminar este cliente? Esta acción es irreversible.", 
        () => ejecutarFetch('DELETE', { identificacion: id }));
}*/

/**
 * Carga la tabla con datos (Simulado)
 */
const cargarTabla = (listaClientes) => {

    const tbody = document.getElementById("tbodyClientes")
    tbody.innerHTML = ""

    if (listaClientes.length === 0) {

        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No se encontraron registros</td></tr>`
        return
    }

    listaClientes.forEach(cliente => {

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${cliente.identificacion}</td>
            <td>${cliente.nombre}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.correo}</td>
            <td>
                <span class="badge ${cliente.estado === 'activo' ? 'badge-active' : 'badge-inactive'}">
                    ${cliente.estado}
                </span>
            </td>
            <td>
                <button class="btn-table" onclick="seleccionarFila('${cliente.identificacion}')" title="Editar">
                    <i class="fa fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr)
    })
}

/**
 * Selecciona un cliente de la tabla y lo carga en el form
 */
const seleccionarFila = (id) => {
    // Aquí normalmente buscarías en tu array de datos local
    // Simulando que encontramos al cliente:
    document.getElementById("identificacion").value = id
    buscarCliente() // Reutilizamos la lógica de búsqueda que ya definimos
}

/**
 * Filtro rápido en cliente (lado cliente)
 */
const filtrarTabla = () => {

    const input = document.getElementById("filterInput")
    const filter = input.value.toUpperCase()
    const table = document.getElementById("tablaClientes")
    const tr = table.getElementsByTagName("tr")

    for (let i = 1; i < tr.length; i++) {

        let td = tr[i].getElementsByTagName("td")[1] // Columna Nombre
        if (td) {
            let textValue = td.textContent || td.innerText
            tr[i].style.display = textValue.toUpperCase().indexOf(filter) > -1 ? "" : "none"
        }
    }
}