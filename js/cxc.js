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

    cargarClientes()
    //cargarPlanCredito()

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

// Buscar cuentas según filtros
const buscarCuentas = async () => {

    const customerId = document.getElementById("searchCustomer").value
    const invoiceNum = document.getElementById("searchFactura").value
    const status = document.getElementById("filterEstado").value

    try {

        const response = await fetch(`${API_URL}/receivables/search?customerId=${customerId}&invoice=${invoiceNum}&status=${status}`)
        const data = await response.json()
        renderReceivablesTable(data)

    } catch (error) {
        console.error("Error searching receivables:", error)
    }
}

const renderReceivablesTable = (accounts) => {

    const tbody = document.getElementById("cxcBody")
    tbody.innerHTML = ""

    if (accounts.length === 0) {

        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron cuentas</td></tr>`
        return
    }

    accounts.forEach(acc => {

        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td class="text-center">${acc.invoice_number}</td>
            <td>${acc.customer_name}</td>
            <td class="text-right">₡${acc.total_amount.toLocaleString()}</td>
            <td class="text-right text-danger"><strong>₡${acc.current_balance.toLocaleString()}</strong></td>
            <td class="text-center"><span class="badge ${acc.status === 'PENDIENTE' ? 'badge-active' : 'badge-inactive'}">${acc.status}</span></td>
            <td class="text-center">
                <button class="btn-table" onclick="verDetalleCuotas('${acc.id}', '${acc.invoice_number}', ${acc.current_balance})" title="Ver Abonos">
                    <i class="fa fa-eye"></i>
                </button>
            </td>
        `
        tbody.appendChild(tr)

    })
}

const verDetalleCuotas = async (receivableId, invoiceNum, balance) => {

    document.getElementById("txtFacturaSeleccionada").innerText = invoiceNum
    document.getElementById("saldoPendienteTxt").innerText = `₡${balance.toLocaleString()}`
    
    // Cambiar layout para mostrar detalle
    document.getElementById("cxcGrid").classList.remove("hidden-detail")
    document.getElementById("detalleCuentaContainer").classList.remove("hidden")

    try {

        const response = await fetch(`${API_URL}/receivables/installments/${receivableId}`)
        const installments = await response.json()
        renderInstallmentsTable(installments)

    } catch (error) {
        console.error("Error loading installments:", error)
    }
}

const renderInstallmentsTable = (installments) => {

    const tbody = document.getElementById("planPagosBody")
    tbody.innerHTML = ""

    installments.forEach(inst => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td>Cuota ${inst.installment_number}</td>
            <td>${inst.due_date}</td>
            <td class="text-right">₡${inst.amount.toLocaleString()}</td>
            <td class="text-center">
                ${inst.status === 'PENDIENTE' ? 
                    `<button class="btn-pay-cuota" onclick="confirmarCobro('${inst.id}', ${inst.amount}, '${inst.receivable_id}')">
                        <i class="fa fa-cash-register"></i> Cobrar
                    </button>` : 
                    `<span class="text-success"><i class="fa fa-check-circle"></i> Pagado</span>`
                }
            </td>
        `
        tbody.appendChild(tr)

    })
}

// Función principal para procesar el pago (Flexible)
const confirmarCobro = async (installmentId, suggestedAmount, receivableId) => {

    const { value: amountPaid } = await Swal.fire({
        title: 'Registrar Pago de Cuota',
        text: `Monto sugerido: ₡${suggestedAmount.toLocaleString()}`,
        input: 'number',
        inputLabel: 'Monto recibido del cliente',
        inputValue: suggestedAmount,
        showCancelButton: true,
        confirmButtonColor: '#00B3A4',
        confirmButtonText: 'Procesar Pago',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value || value <= 0) return 'Debe ingresar un monto válido'
        }
    })

    if (amountPaid) {

        try {

            const response = await fetch(`${API_URL}/payments/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    installment_id: installmentId,
                    receivable_id: receivableId,
                    amount: parseFloat(amountPaid),
                    date: new Date().toISOString().split('T')[0]
                })
            })

            const result = await response.json()

            if (result.success) {

                Swal.fire('¡Éxito!', 'Pago registrado y saldo actualizado.', 'success')
                imprimirComprobanteAbono(result.payment_data)
                buscarCuentas()
                cerrarDetalle()
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo procesar el pago.', 'error')
        }
    }
}

const imprimirComprobanteAbono = (data) => {

    document.getElementById("facturaNumero").innerText = data.receipt_number
    document.getElementById("facturaFecha").innerText = data.date
    document.getElementById("facturaCliente").innerText = data.customer_name
    document.getElementById("facturaReferencia").innerText = data.invoice_ref
    document.getElementById("facturaTotal").innerText = `₡${data.amount_paid.toLocaleString()}`
    document.getElementById("facturaSaldoRestante").innerText = `₡${data.new_balance.toLocaleString()}`

    document.getElementById("modalFactura").style.display = "flex"
}

const cerrarDetalle = () => {

    document.getElementById("cxcGrid").classList.add("hidden-detail")
    document.getElementById("detalleCuentaContainer").classList.add("hidden")
}

const cerrarModal = () => {

    document.getElementById("modalFactura").style.display = "none"
}