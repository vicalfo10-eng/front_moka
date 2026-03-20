const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){

        window.location.href = "index.html"
        return

    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario

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
    localStorage.removeItem("usuario");
    window.location.href = "index.html";

}

const getFormData = () => {

    return {

        codigoProducto: document.getElementById("codigoProducto").value.trim(),
        cantidad: document.getElementById("cantidad").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        tipo: document.getElementById("tipoMovimiento").value,
    }
}

const limpiarFormulario = () => {

    document.getElementById("formInventario").reset()
    document.getElementById('tbodyHistorial').innerHTML = ''
    document.getElementById('buscarMovProducto').value = ''

}

const buscarProducto = async () => {

    const idInput = document.getElementById("codigo").value.trim()

    if (!idInput) {
        return Swal.fire({
            title: "Información",
            text: "El código del producto es obligatorio.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
    }
    
    try {

        // Llamada al API (Ajusta la URL según tu backend)
        const response = await fetch(`${API_URL}/product_register?codigo=${idInput}`)
        const data = await response.json()

        if (data.ok) {

            document.getElementById("codigoProducto").value = data.result.id_producto;
            document.getElementById("nombre").value = data.result.nombre;

        } else {

            Swal.fire({
                title: "Información",
                text: data.result.msg,
                icon: "info",
                confirmButtonColor: '#17a2b8'
            })
        }
    } catch (error) {

        Swal.fire("Error", "Error al obtener el producto: " + error.message, "error")
    }
}

const guardarMovimiento = async () => {

    const getData = getFormData()

    try {

        const response = await fetch(`${API_URL}/inventory_register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_producto: getData.codigoProducto,
                id_usuario: JSON.parse(localStorage.getItem("codigo")),
                tipo: getData.tipo,
                cantidad: getData.cantidad,
                descripcion: getData.descripcion
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
            text: data.msg,
            icon: "success",
            confirmButtonColor: '#00B3A4'
        })

        limpiarFormulario() // limpiar formulario

    } catch (error) {

        Swal.fire("Error", "Error al registrar el movimiento: " + error.message, "error")       
    }
}

// Función para buscar y cargar la tabla
let paginaActual = 1

const cargarHistorial = async ( nuevaPagina = 1) => {
    
    paginaActual = nuevaPagina

    const codigo = document.getElementById('buscarMovProducto').value.trim()
    const tbody = document.getElementById('tbodyHistorial')
    
    try {

        const response = await fetch(`${API_URL}/inventory_movements?codigo=${codigo}&pagina=${paginaActual}`)
        const res = await response.json()

        let listaMovimientos = [];

        if (res.result) {
            // Si res.result ya es un array, lo usamos. 
            // Si es un objeto único (como el que pusiste), lo envolvemos en [ ]
            listaMovimientos = Array.isArray(res.result) ? res.result : [res.result];
        }

        tbody.innerHTML = ''; 

        if (listaMovimientos.length > 0) {
            listaMovimientos.forEach(mov => {
                // Formato de fecha para Costa Rica
                const fechaCR = new Date(mov.fecha).toLocaleString('es-CR', { hour12: false });
            
                tbody.innerHTML += `
                    <tr>
                        <td>${fechaCR}</td>
                        <td>${mov.codigo_producto}</td>
                        <td>${mov.nombre_producto}</td>
                        <td class="${mov.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}">
                            <strong>${mov.tipo}</strong>
                        </td>
                        <td>${mov.cantidad}</td>
                        <td>${mov.descripcion || ''}</td>
                        <td>${mov.nombre_usuario}</td>
                    </tr>`;
            });
        
            // Usamos el campo total_registros que viene en tu objeto para la paginación
            const totalRegistros = listaMovimientos[0].total_registros;

            document.getElementById('infoPagina').innerText = `Página ${paginaActual}`;
            document.getElementById('btnAnterior').disabled = (paginaActual === 1);

            // Si el total de registros es mayor a lo que ya mostramos (página * 10)
            document.getElementById('btnSiguiente').disabled = (paginaActual * 10 >= totalRegistros);
        
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay registros para mostrar</td></tr>';
            document.getElementById('btnSiguiente').disabled = true;
        }

    } catch (error) {

        console.error("Error al cargar historial:", error)
    }
}

const cambiarPagina = (delta) => {

    const proximaPagina = paginaActual + delta

    if (proximaPagina > 0) {
        cargarHistorial(proximaPagina)
    }
}