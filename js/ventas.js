const API_URL = config.API_URL

let carrito = []

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){

        window.location.href = "index.html"
        return

    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario

    // Evento para cargar los proveedores
    cargarClientes()

})

/* SIDEBAR COLLAPSE */

const toggleSidebar = () => {

    document.getElementById("sidebar")
    .classList.toggle("collapsed")

}

/* MENU EXPAND */
const toggleMenu = (element) => {

    const sidebar = document.getElementById("sidebar");

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

const cargarClientes = async () => {

    const select = document.getElementById("customerSelect")

    try {

        const response = await fetch(`${API_URL}/customer_all`)
        const data = await response.json()

        if (!response.ok) {
            throw new Error("No se pudieron cargar los clientes")
        }

        select.innerHTML = '<option value="">Seleccione un cliente</option>'

        data.customer.forEach(cliente => {
            const option = document.createElement("option")
            option.value = cliente.id_cliente
            option.textContent = cliente.nombre
            select.appendChild(option)
        });

    } catch (error) {
        console.error("Error cargando clientes:", error)
        select.innerHTML = '<option value="">Error al cargar clientes</option>'
    }
}

/**
 * Lógica de Búsqueda
 */
const agregarProducto = async () => {

    const idInput = document.getElementById("codigoProducto").value.trim()

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
            const p = data.result // Ajustado según tu estructura de respuesta
            const exists = carrito.find(item => item.id_producto === p.id_producto)

            if (exists) {

                exists.cantidad++
                actualizarLinea(carrito.indexOf(exists), 'cantidad', exists.cantidad)

            } else {
                const nuevoItem = {
                    id_producto: p.id_producto,
                    codigo: p.codigo,
                    nombre: p.nombre,
                    precio: parseFloat(p.precio),
                    impuesto_porc: parseFloat(p.impuesto),
                    cantidad: 1,
                    descuento_porc: 0, // Porcentaje de descuento inicial
                    descuento: 0,      // Monto en colones
                    monto_impuesto: 0,
                    subtotal: 0,
                    total_linea: 0
                }

                carrito.push(nuevoItem)
                actualizarLinea(carrito.length - 1, 'cantidad', 1)

            }

            document.getElementById('codigoProducto').value = ""

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

/**
 * Realiza todos los cálculos de una fila
 */
const actualizarLinea = (index, campo, valor) => {

    const item = carrito[index]
    let val = parseFloat(valor) || 0

    if (campo === 'cantidad') {
        // Forzamos a que sea un número entero (Integer)
        item.cantidad = Math.floor(val) > 0 ? Math.floor(val) : 1;
    }

    if (campo === 'desc_porc') {
        // Usamos un factor de 100 para truncar a 2 decimales exactos
        val = Math.floor(val * 100) / 100; 
        item.descuento_porc = (val >= 0 && val <= 100) ? val : 0;
    }

    // 1. Subtotal Bruto
    const bruto = item.precio * item.cantidad
    // 2. Descuento
    item.descuento = Math.round((bruto * (item.descuento_porc / 100)) * 100) / 100;
    // 3. Base para impuesto (Neto)
    const neto = bruto - item.descuento
    // 4. Impuesto
    item.monto_impuesto = Math.round(neto * (item.impuesto_porc / 100) * 100) / 100
    // 5. Totales
    item.subtotal = bruto
    item.total_linea = neto + item.monto_impuesto

    renderCarrito()
}

const renderCarrito = () => {

    const body = document.getElementById('carritoBody')
    body.innerHTML = ""
    let totalFactura = 0

    carrito.forEach((item, index) => {

        totalFactura += item.total_linea

        // Función auxiliar interna para formatear a 2 decimales con miles
        const f = (num) => num.toLocaleString('es-CR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })

        body.innerHTML += `
            <tr>
                <td class="text-center">${item.codigo}</td>

                <td>${item.nombre}</td>

                <td class="text-center">
                    <input type="number" class="input-tabla" value="${item.cantidad}" step="1"
                    onchange="actualizarLinea(${index}, 'cantidad', this.value)">
                </td>

                <td class="text-right">₡${f(item.precio)}</td>

                <td class="text-center">
                    <input type="number" 
                            class="input-tabla"
                            value="${item.descuento_porc}"
                            step="0.01"
                            oninput="if(this.value > 100) this.value = 100; if(this.value.includes('.')) { let parts = this.value.split('.'); if(parts[1].length > 2) this.value = parts[0] + '.' + parts[1].slice(0, 2); }"
                            onchange="actualizarLinea(${index}, 'desc_porc', this.value)">
                </td>

                <td class="text-right">
                    ₡${f(item.descuento)}
                </td>
                <td class="text-right">${f(item.impuesto_porc)}%</td>

                <td class="text-right">₡${f(item.monto_impuesto)}</td>

                <td class="text-right"><strong>₡${f(item.total_linea)}</strong></td>

                <td class="text-center">
                    <i class="fa fa-trash-can text-danger" onclick="eliminarItem(${index})" style="cursor:pointer"></i>
                </td>
            </tr>`
    })

    // Total final también con 2 decimales
    document.getElementById('totalVenta').innerText = `₡${totalFactura.toLocaleString('es-CR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`
}

const eliminarItem = (index) => {

    carrito.splice(index, 1)
    renderCarrito()
}

/**
 * Envía la venta al SP de la Base de Datos
 */
const procesarVenta = async () => {

    const idCliente = document.getElementById("customerSelect").value
    const idUsuario = JSON.parse(localStorage.getItem("codigo"))
    const btnVenta = document.querySelector(".btn-finish")

    if (!idCliente) {
        Swal.fire({
            title: "Información",
            text: "Debe seleccionar un cliente para procesar la venta.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
        return
    }

    if (carrito.length === 0) {
            Swal.fire({
                title: "Atención",
                text: "El detalle de ventas está vacío.",
                icon: "warning",
                confirmButtonColor: '#df9848'
        })
        return
    }

    // Bloqueamos el botón para evitar doble envío
    btnVenta.disabled = true
    btnVenta.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Procesando...'

    const ventaData = {

        id_usuario: idUsuario,
        id_cliente: parseInt(idCliente),
        detalles: carrito.map(item => {
            // Función interna para asegurar 2 decimales numéricos
            const clean = (num) => Number(parseFloat(num).toFixed(2));

            return {
                id_producto: item.id_producto,
                cantidad: Math.floor(item.cantidad), // Siempre entero
                precio: clean(item.precio),
                subtotal: clean(item.subtotal),
                descuento: clean(item.descuento), // Monto en colones
                impuesto: clean(item.impuesto_porc), // El % (ej: 13.00)
                total_impuesto: clean(item.monto_impuesto),
                total_linea: clean(item.total_linea)
            }
        })
    }

    try {

        const response = await fetch(`${API_URL}/sales_register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventaData)
        })

        const data = await response.json()

        if (data.sale.ok) {

            const idGenerado = data.sale.factura

            mostrarTicket(idGenerado)

            Swal.fire({
                title: "Registro Exitoso",
                text: data.sale.msg, // Usamos el msg que viene del SP (ej: 'Venta registrada correctamente')
                icon: "success",
                confirmButtonColor: '#00B3A4'
            })

            .then(() => {
            // Limpieza de interfaz
                carrito = []
                renderCarrito()
                document.getElementById("customerSelect").value = ""
                document.getElementById("codigoProducto").focus()
            })

        } else {

            Swal.fire({
                title: "Revisar Inventario",
                text: data.sale.msg,
                icon: "error",
                confirmButtonColor: '#e74c3c'
            })
            return
        }
    } catch (error) {

        Swal.fire("Error", "Error de conexión con el backend", "error")

    } finally {

        // Siempre reactivamos el botón al final
        btnVenta.disabled = false
        btnVenta.innerHTML = '<i class="fa fa-shopping-cart"></i> Finalizar Venta'
    }
}

const mostrarTicket = (idVenta) => {
    const f = (num) => num.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    
    // Asignar el ID de venta real (puedes formatearlo con ceros a la izquierda)
    document.getElementById("facturaNumero").innerText = String(idVenta).padStart(6, '0')
    
    document.getElementById("facturaFecha").innerText = new Date().toLocaleString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    })
    document.getElementById("facturaCliente").innerText = document.getElementById("customerSelect").options[document.getElementById("customerSelect").selectedIndex].text
    document.getElementById("facturaVendedor").innerText = document.getElementById("nombreUsuarioTop").innerText

    const body = document.getElementById("facturaDetalleBody")
    body.innerHTML = ""
    
    let subtotalGral = 0
    let descuentoGral = 0
    let impuestosGral = 0
    let totalGral = 0

    // Usamos el carrito actual antes de limpiarlo
    carrito.forEach(item => {
        subtotalGral += item.subtotal
        descuentoGral += item.descuento
        impuestosGral += item.monto_impuesto
        totalGral += item.total_linea

        body.innerHTML += `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.cantidad}/${f(item.descuento_porc)}</td>
                <td>${f(item.precio)}</td>
            </tr>
            <tr>
                <td>${f(item.nombre)}</td>
            </tr>
        `
    })

    document.getElementById("facturaSubtotal").innerText = `₡${f(subtotalGral)}`
    document.getElementById("facturaDescuento").innerText = `₡${f(descuentoGral)}`
    document.getElementById("facturaImpuestos").innerText = `₡${f(impuestosGral)}`
    document.getElementById("facturaTotal").innerText = `₡${f(totalGral)}`

    document.getElementById("modalFactura").style.display = "flex"
}