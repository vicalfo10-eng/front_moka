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

    cambiarInterfazFiltros()

}

const cambiarInterfazFiltros = () => {

    const tipo = document.getElementById('tipoReporte').value
    const grupoInicio = document.getElementById('grupoFechaInicio')
    const grupoFin = document.getElementById('grupoFechaFin')
    const anterior = document.getElementById('btnAnterior')
    const pagina = document.getElementById('infoPagina')
    const siguiente = document.getElementById('btnSiguiente') // Contenedor de botones de paginación

    if (tipo === 'VENTAS_FECHAS') {

        grupoInicio.classList.remove('hidden')
        grupoFin.classList.remove('hidden')

    } else {

        grupoInicio.classList.add('hidden')
        grupoFin.classList.add('hidden')
    }

    if (tipo === 'MAS_VENDIDOS') {

        anterior.style.display = 'none'
        pagina.style.display = 'none'
        siguiente.style.display = 'none'

    } else {

        anterior.style.display = 'flex'
        pagina.style.display = 'flex'
        siguiente.style.display = 'flex'
    }
}

// Función para buscar y cargar la tabla
let paginaActual = 1

const generarReporte = async ( nuevaPagina = 1 ) => {

    paginaActual = nuevaPagina

    const tipo = document.getElementById('tipoReporte').value
    const fechaInicio = document.getElementById('fechaInicio').value
    const fechaFin = document.getElementById('fechaFin').value
    const tbody = document.getElementById('tbodyReporte')
    const thead = document.getElementById('theadReporte')

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

        const response = await fetch(`${API_URL}/sales-by-date?tipo=${tipo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&pagina=${paginaActual}`)
        const data = await response.json()

        tbody.innerHTML = ''
        thead.innerHTML = ''

        const lista = (data.result && data.result) ? data.result : []
        const infoControl = lista[0] || {}

        if (infoControl.ok === 1) {

            switch (tipo) {

                case 'VENTAS_FECHAS':

                    thead.innerHTML = `
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Vendedor</th>
                            <th>Total</th>
                        </tr>`
                    
                        lista.forEach(v => {
                        tbody.innerHTML += `
                            <tr>
                                <td>#${v.id_venta}</td>
                                <td>${v.fecha}</td>
                                <td>${v.cliente}</td>
                                <td>${v.vendedor}</td>
                                <td>₡${parseFloat(v.total).toLocaleString('es-CR')}</td>
                            </tr>`

                        // Usamos el campo total_registros que viene en tu objeto para la paginación
                        const totalRegistros = infoControl.total_registros

                        document.getElementById('infoPagina').innerText = `Página ${paginaActual}`
                        document.getElementById('btnAnterior').disabled = (paginaActual === 1)

                        // Si el total de registros es mayor a lo que ya mostramos (página * 10)
                        document.getElementById('btnSiguiente').disabled = (paginaActual * 10 >= totalRegistros)
                    })
                    break

                case 'STOCK_BAJO':

                    thead.innerHTML = `
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th class="text-center">Stock Actual</th>
                            <th class="text-center">Stock Mínimo</th>
                        </tr>`

                    lista.forEach(p => {
                        tbody.innerHTML += `
                            <tr>
                                <td>${p.codigo}</td>
                                <td>${p.nombre}</td>
                                <td class="text-danger text-center"><strong>${p.stock}</strong></td>
                                <td class="text-center">${p.stock_minimo}</td>
                            </tr>`

                        // Usamos el campo total_registros que viene en tu objeto para la paginación
                        const totalRegistros = infoControl.total_registros
                                    
                        document.getElementById('infoPagina').innerText = `Página ${paginaActual}`
                        document.getElementById('btnAnterior').disabled = (paginaActual === 1)
                                    
                        // Si el total de registros es mayor a lo que ya mostramos (página * 10)
                        document.getElementById('btnSiguiente').disabled = (paginaActual * 10 >= totalRegistros)
                    })
                    break

                case 'MAS_VENDIDOS':

                    thead.innerHTML = `
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Unidades</th>
                            <th>Ingresos</th>
                        </tr>`

                    lista.forEach((p, index) => {
                        tbody.innerHTML += `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${p.nombre}</td>
                                <td>${p.total_unidades}</td>
                                <td>₡${parseFloat(p.total_ingresos).toLocaleString('es-CR')}</td>
                            </tr>`
                    })
                    break
            }

        } else {

            tbody.innerHTML = `<tr><td colspan="100%" style="text-align:center;">${infoControl.msg || 'Sin datos'}</td></tr>`
        }
    } catch (error) {

        console.error(error)
        tbody.innerHTML = `<tr><td colspan="100%" style="text-align:center; color:red;">Error de servidor</td></tr>`
    }
}

const cambiarPagina = (delta) => {

    const proximaPagina = paginaActual + delta

    if (proximaPagina > 0) {
        generarReporte(proximaPagina)
    }
}

const imprimirReporte = () => {

    const tabla = document.getElementById("tablaReporte")
    const titulo = document.getElementById("tipoReporte").options[document.getElementById("tipoReporte").selectedIndex].text
    
    if (!tabla || tabla.rows.length <= 1) {

        Swal.fire({
                title: "Atención",
                text: "No hay datos en la tabla para imprimir.",
                icon: "warning",
                confirmButtonColor: '#df9848'
        })
        return
    }

    // Crear una ventana temporal
    const ventanaImpresion = window.open('', '_blank')
    
    ventanaImpresion.document.write(`
        <html>
            <head>
                <title>MOKA - Reporte</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header img { width: 80px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>MOKA - Sistema de Inventario</h2>
                    <h3>${titulo}</h3>
                    <p>Fecha de generación: ${new Date().toLocaleDateString()}</p>
                </div>
                ${tabla.outerHTML}
            </body>
        </html>`
    )

    ventanaImpresion.document.close()
    ventanaImpresion.print()
    ventanaImpresion.close()
}