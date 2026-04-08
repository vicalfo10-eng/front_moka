const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){

        window.location.href = "index.html"
        return
    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario

    const fechaInicioInput = document.getElementById('fechaInicio')
    const fechaFinInput = document.getElementById('fechaFin')

    if (fechaInicioInput && fechaFinInput) {

        fechaInicioInput.addEventListener('change', function() {
            const fechaSeleccionada = this.value
            fechaFinInput.min = fechaSeleccionada

            if (fechaFinInput.value && fechaFinInput.value < fechaSeleccionada) {

                fechaFinInput.value = fechaSeleccionada
            }
        })
    }
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

const limpiarFormulario = () => {

    document.getElementById("fechaInicio").value = ""
    document.getElementById("fechaFin").value = ""
    
    document.getElementById("tipoReporte").selectedIndex = 0

    document.getElementById("theadReporte").innerHTML = ""
    document.getElementById("tbodyReporte").innerHTML = `
        <tr>
            <td colspan="100%" style="text-align:center;">Seleccione un reporte y presione generar</td>
        </tr>`

}

// Función para generar el reporte
const generarReporte = async () => {
    const tipo = document.getElementById('tipoReporte').value
    const fechaInicio = document.getElementById('fechaInicio').value
    const fechaFin = document.getElementById('fechaFin').value
    const tbody = document.getElementById('tbodyReporte')
    const thead = document.getElementById('theadReporte')

    // Validación básica de fechas para el reporte de ventas
    if (tipo === 'VENTAS_FECHAS' && (!fechaInicio || !fechaFin)) {
        Swal.fire({
            title: "Información",
            text: "Debe seleccionar un tipo y un rango de fechas valido.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
        return
    }

    try {

        // Asumimos que tu endpoint en Node acepta estos parámetros
        const response = await fetch(`${API_URL}/sales-by-date?tipo=${tipo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
        const data = await response.json()

        // Limpiar tabla
        tbody.innerHTML = ''
        thead.innerHTML = ''

        // El SP devuelve un array. Validamos el primer elemento (estándar MOKA)
        const lista = (data.result && data.result) ? data.result : []
        console.log("Respuesta del SP:", lista) // Verificar respuesta del SP
        const infoControl = lista[0] || {}
 // Verificar respuesta del SP
        if (infoControl.ok === 1) {
            
            // 1. Configurar encabezados según el reporte
            if (tipo === 'VENTAS_FECHAS') {
                thead.innerHTML = `
                    <tr>
                        <th>ID Venta</th>
                        <th>Fecha/Hora</th>
                        <th>Cliente</th>
                        <th>Vendedor</th>
                        <th>Total</th>
                    </tr>`
                
                // 2. Pintar filas
                lista.forEach(venta => {
                    tbody.innerHTML += `
                        <tr>
                            <td>#${venta.id_venta}</td>
                            <td>${venta.fecha}</td>
                            <td>${venta.cliente}</td>
                            <td>${venta.vendedor}</td>
                            <td><strong>₡${parseFloat(venta.total).toLocaleString('es-CR')}</strong></td>
                        </tr>`

                })
            }
            // Aquí agregarás los demás elses if para STOCK_BAJO, etc.

        } else {

            // Manejo de error según el mensaje del SP
            tbody.innerHTML = `<tr><td colspan="100%" style="text-align:center;">${infoControl.msg || 'No hay datos'}</td></tr>`
        }

    } catch (error) {

        console.error("Error al generar reporte:", error)
        tbody.innerHTML = `<tr><td colspan="100%" style="text-align:center; color:red;">Error de conexión con el servidor</td></tr>`

    }
}