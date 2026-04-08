const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){

        window.location.href = "index.html"
        return
    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario

    cargarKPIs()
    inicializarGraficos()

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

const cargarKPIs = async () => {

    try {

        const response = await fetch(`${API_URL}/dashboard_kpis`)
        const data = await response.json()

        // 1. Actualizar Ventas (con formato de moneda de Costa Rica)
        const ventasElement = document.getElementById('kpiVentas')

        if (ventasElement) {

            ventasElement.innerText = new Intl.NumberFormat('es-CR', {
                style: 'currency',
                currency: 'CRC'
            }).format(data.ventas_mes)
        }

        // 2. Actualizar Stock Total
        const stockElement = document.getElementById('kpiStock')

        if (stockElement) {

            stockElement.innerText = `${data.stock_total} unidades`
        }

        // 3. Actualizar Movimientos de Hoy
        const movElement = document.getElementById('kpiMovimientos')

        if (movElement) {

            movElement.innerText = `${data.movimientos_hoy} registros`
        }

    } catch (error) {

        console.error("Error cargando indicadores:", error)
    }
}

const inicializarGraficos = async () => {

    try {

        const response = await fetch(`${API_URL}/dashboard_charts`)
        const data = await response.json()

        console.log("Datos para gráficos:", data) // Verificar datos recibidos

        // 1. Gráfico de Ventas Semanales
        const ctxVentas = document.getElementById('chartVentasSemanales').getContext('2d')
    
        new Chart(ctxVentas, {
            type: 'line',
            data: {
                labels: data.ventas_mes.map(v => v.dia),
                datasets: [{
                    label: 'Ventas Diarias (₡)',
                    data: data.ventas_mes.map(v => v.total),
                    borderColor: '#8e44ad',
                    backgroundColor: 'rgba(142, 68, 173, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },

            options: { responsive: true, maintainAspectRatio: false }
        })

        // 2. Gráfico de Productos Top
        const ctxProd = document.getElementById('chartProductosTop').getContext('2d')

        new Chart(ctxProd, {
            type: 'bar',
            data: {
                labels: data.top_productos.map(p => p.nombre),
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: data.top_productos.map(p => p.cantidad),
                    backgroundColor: '#16a085'
                }]
            },

            options: { responsive: true, maintainAspectRatio: false }
        })

    } catch (error) {

        console.error("Error al cargar gráficos:", error)
    }
}