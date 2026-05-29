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

const formatearMoneda = (valor) => {

    if (valor === null || valor === undefined) return "0,00"
    
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor).replace(/\u00a0/g, ' ')

}

const cargarClientes = async () => {

    const select = document.getElementById("searchCustomer")

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

const buscarCuentas = async () => {

    const customerId = document.getElementById("searchCustomer").value.trim() || 0
    const invoiceNum = document.getElementById("searchFactura").value.trim() || 0

    if (!customerId && !invoiceNum) {

        return Swal.fire({
            title: "Información",
            text: "Ingrese un número de factura o seleccione un cliente.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
    }

    try {

        const response = await fetch(`${API_URL}/receivables/search?id_cliente=${customerId}&id_venta=${invoiceNum}`)
        const data = await response.json()

        if (data.ok === 1) {

            const listaCuentas = data.accounts

            dibujarTablaCuentas(listaCuentas)
            document.getElementById("countResults").innerText = `${listaCuentas.length} Facturas`

            if (invoiceNum && invoiceNum.toString().trim() !== "" && listaCuentas.length === 1) {

                const facturaUnica = listaCuentas[0]
                verDetalleCuotas(facturaUnica.id, facturaUnica.invoice_number, facturaUnica.current_balance)
                
            } else {
                cerrarDetalle()
            }

        } else {

            dibujarTablaCuentas([])
            document.getElementById("countResults").innerText = `0 Facturas`
            cerrarDetalle()
            
            if (data.status === 404) {
                console.log("Información:", data.msg)
            }
        }

    } catch (error) {
        console.error("Error técnico:", error)
        Swal.fire("Error", "No se pudo completar la búsqueda", "error")
    }
}

const dibujarTablaCuentas = (accounts) => {

    const tbody = document.getElementById("cxcBody")
    tbody.innerHTML = ""

    if (accounts.length === 0) {

        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron cuentas.</td></tr>`
        return
    }

    accounts.forEach(acc => {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td class="text-center">${acc.invoice_number}</td>
            <td>${acc.customer_name}</td>
            <td class="text-center">₡${formatearMoneda(parseFloat(acc.total_amount))}</td>
            <td class="text-center">₡${formatearMoneda(parseFloat(acc.current_balance))}</td>
            <td class="text-center">${acc.status_text}</td>
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

    const txtFactura = document.getElementById("txtFacturaSeleccionada")
    const txtSaldo = document.getElementById("saldoPendienteTxt")
    
    if(txtFactura) txtFactura.innerText = invoiceNum
    if(txtSaldo) txtSaldo.innerText = `₡${formatearMoneda(parseFloat(balance))}`
    
    // Mostrar el contenedor de detalle (Card derecha)
    document.getElementById("detalleCuentaContainer").classList.remove("hidden")

    try {

        const response = await fetch(`${API_URL}/receivables/installments?id_cxc=${receivableId}`)
        const installments = await response.json()

        dibujarTablaCuotas(installments)

    } catch (error) {

        console.error("Error al cargar cuotas:", error)
    }
}

const dibujarTablaCuotas = (data) => {

    const listaCuotas = data.quotas

    const tbody = document.getElementById("cuotasBody")

    if(!tbody) return
    tbody.innerHTML = ""

    listaCuotas.forEach(inst => {

        const tr = document.createElement("tr")

        tr.innerHTML = `
            <td class="text-center">${inst.numero_cuota}</td>
            <td class="text-center">${new Date(inst.due_date).toLocaleDateString('es-CR')}</td>
            <td class="text-center">₡${formatearMoneda(parseFloat(inst.amount))}</td>
            <td class="text-center">₡${formatearMoneda(parseFloat(inst.balance))}</td>
            <td class="text-center">
                <span class="badge ${inst.status_text === 'PAGADA' ? 'badge-active' : 'badge-inactive'}">
                    ${inst.status_text}
                </span>
            </td>
            <td class="text-center">
                ${inst.status_text !== 'PAGADA' ? 
                    `<button class="btn-table" title="Cobrar Cuota" 
                        onclick="confirmarCobro('${inst.id_cuota}', ${inst.balance}, '${inst.id_cxc}')">
                        <i class="fa fa-cash-register"></i>
                    </button>` : 
                    `<i class="fa fa-check-circle text-success" title="Pagado"></i>`
                }
            </td>
        `
        tbody.appendChild(tr)
    })
}

const confirmarCobro = async (installmentId, suggestedAmount, receivableId) => {

    const idUsuario = JSON.parse(localStorage.getItem("codigo"))
    const sugeridoFormateado = formatearMoneda(parseFloat(suggestedAmount))

    const { value: formValues } = await Swal.fire({
        title: 'Registrar Pago de Cuota',
        html: `
            <div style="margin-bottom: 15px; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 0.9rem;">Monto sugerido:</p>
                <strong style="font-size: 1.2rem; color: var(--morado);">₡${sugeridoFormateado}</strong>
            </div>

            <div style="text-align: left; width: 85%; margin: 0 auto;">
                <label style="font-weight:600; display:block; margin-bottom:5px; color: #444;">Monto recibido:</label>
                <input id="swal-input-monto" type="number" step="0.01" class="swal2-input" 
                    value="${suggestedAmount}" 
                    style="text-align: center; font-weight: bold; margin: 0 0 15px 0; width: 100%; border-radius: 8px;">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-weight:600; display:block; margin-bottom:5px; color: #444;">Método:</label>
                        <select id="swal-input-metodo" class="swal2-input" style="margin: 0; width: 100%; border-radius: 8px; font-size: 0.9rem;">
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="SINPE">Sinpe Móvil</option>
                            <option value="TARJETA">Tarjeta</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight:600; display:block; margin-bottom:5px; color: #444;">Comprobante:</label>
                        <input id="swal-input-comprobante" type="text" class="swal2-input" placeholder="Opcional" style="margin: 0; width: 100%; border-radius: 8px; font-size: 0.9rem;">
                    </div>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#00B3A4',
        cancelButtonColor: '#95a5a6',
        confirmButtonText: '<i class="fa fa-cash-register"></i> Procesar Pago',
        cancelButtonText: 'Cancelar',
        target: document.querySelector('.main'),
        
        preConfirm: () => {

            const monto = document.getElementById('swal-input-monto').value
            const metodo = document.getElementById('swal-input-metodo').value
            const comprobante = document.getElementById('swal-input-comprobante').value

            if (!monto || monto <= 0) {

                Swal.showValidationMessage('Debe ingresar un monto válido')
                return false

            }

            return {
                monto: parseFloat(monto),
                metodo: metodo,
                comprobante: comprobante
            }
        },

        didOpen: () => {

            const inputMonto = document.getElementById('swal-input-monto')
            const selectMetodo = document.getElementById('swal-input-metodo')
            
            // Aplicar estilos al select para que coincida con MOKA
            Object.assign(selectMetodo.style, {
                fontSize: '1rem',
                fontFamily: "'Poppins', sans-serif",
                color: '#444',
                padding: '0 10px',
                border: '1px solid #ddd',
                height: '45px',
                outline: 'none',
                boxShadow: 'none'
            })

            // Visor dinámico centrado
            const preview = document.createElement('div')

            Object.assign(preview.style, {
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '1rem',
                textAlign: 'center',
                border: '1px solid #eee'
            })

            preview.id = 'live-amount-preview'
            preview.innerHTML = `Monto a procesar: <strong style="color: #28a745;">₡${sugeridoFormateado}</strong>`
            inputMonto.parentElement.parentElement.appendChild(preview)

            inputMonto.addEventListener('input', (e) => {

                const valorActual = parseFloat(e.target.value) || 0
                preview.innerHTML = `Monto a procesar: <strong style="color: #28a745;">₡${formatearMoneda(valorActual)}</strong>`
            
            })
        }
    })

    if (formValues) {

        try {
            Swal.fire({
                title: 'Procesando...',
                didOpen: () => Swal.showLoading(),
                target: document.querySelector('.main')
            })

            const response = await fetch(`${API_URL}/payments/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    installment_id: installmentId,
                    receivable_id: receivableId,
                    user_id: idUsuario,
                    amount: formValues.monto,
                    payment_method: formValues.metodo,
                    reference: formValues.comprobante,
                    payment_date: new Date().toISOString().split('T')[0]
                })
            })

            const result = await response.json()

            if (result.success) {
                await Swal.fire({
                    title: '¡Éxito!',
                    text: result.msg,
                    icon: 'success',
                    confirmButtonColor: '#00B3A4',
                    target: document.querySelector('.main')
                })
                
                if (result.success && result.payment_data) {
                    if (typeof imprimirComprobanteAbono === 'function') {
                        imprimirComprobanteAbono(result.payment_data);
                    }
                }
                
                buscarCuentas()
                cerrarDetalle()

            } else {

                throw new Error(result.message || 'Error en el servidor')
            }
        } catch (error) {
            
            console.error("Error al cobrar:", error)
            Swal.fire({
                title: 'Error',
                text: 'No se pudo procesar el pago. Intente de nuevo.',
                icon: 'error',
                target: document.querySelector('.main')
            })
        }
    }
}

const imprimirComprobanteAbono = (data) => {

    document.getElementById("facturaNumero").innerText = data.receipt_number
    document.getElementById("facturaFecha").innerText = data.date
    document.getElementById("facturaCliente").innerText = data.customer_name
    document.getElementById("facturaReferencia").innerText = data.invoice_ref
    document.getElementById("facturaTotal").innerText = `₡${formatearMoneda(parseFloat(data.amount_paid))}`
    document.getElementById("facturaSaldoRestante").innerText = `₡${formatearMoneda(parseFloat(data.new_balance))}`

    document.getElementById("modalFactura").style.display = "flex"
}

const cerrarDetalle = () => {

    const container = document.getElementById("detalleCuentaContainer")
    if (container) {
        container.classList.add("hidden")
    }
}

const cerrarModal = () => {

    document.getElementById("modalFactura").style.display = "none"
}

const limpiarFiltros = () => {

    document.getElementById("searchCustomer").value = ""
    document.getElementById("searchFactura").value = ""

    const tbody = document.getElementById("cxcBody")
    tbody.innerHTML = ""

    const countResults = document.getElementById("countResults")
    if (countResults) countResults.innerText = "0 Facturas"

    cerrarDetalle()
}