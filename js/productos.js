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
    cargarCategorias()
    cargarProveedores()

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

// Limpieza en tiempo real
const validarPrecio = (input) => {
    if (input.value < 0) {
        input.value = ""
    }
}

// Valida que solo acepte 2 decimales
const inputPrecio = document.getElementById("precio")

inputPrecio.addEventListener("input", function (e) {
    let valor = e.target.value
    
    // Si contiene un punto decimal
    if (valor.includes(".")) {
        const partes = valor.split(".")
        // Si la parte decimal tiene más de 2 dígitos, recortamos
        if (partes[1].length > 2) {
            e.target.value = `${partes[0]}.${partes[1].slice(0, 2)}`
        }
    }
})

const inputImpuesto = document.getElementById("impuesto")

inputImpuesto.addEventListener("input", function (e) {
    let valor = e.target.value
    
    // Si contiene un punto decimal
    if (valor.includes(".")) {
        const partes = valor.split(".")
        // Si la parte decimal tiene más de 2 dígitos, recortamos
        if (partes[1].length > 2) {
            e.target.value = `${partes[0]}.${partes[1].slice(0, 2)}`
        }
    }
})

// Variable para controlar si estamos editando
let editMode = false

/**
 * Obtiene los datos del formulario de forma limpia
 */
const getFormData = () => {

    return {

        categoria: document.getElementById("categorySelect").value,
        proveedor: document.getElementById("supplierSelect").value,
        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        precio: document.getElementById("precio").value.trim(),
        impuesto: document.getElementById("impuesto").value.trim(),
        stock: document.getElementById("stock").value.trim(),
        stock_min: document.getElementById("stock_min").value.trim(),
        estado: document.querySelector('input[name="estado"]:checked').value
    }
}

const limpiarFormulario = () => {

    document.getElementById("formProductos").reset()
    editMode = false
}

/* =========================
   CARGA CATEWGORÍAS Y PROVEEDORES
========================= */

const cargarCategorias = async () => {

    const select = document.getElementById("categorySelect")

    try {

        const response = await fetch(`${API_URL}/category_status`)
        const data = await response.json()

        if (!response.ok) {
            throw new Error("No se pudieron cargar las categorías")
        }

        select.innerHTML = '<option value="">Seleccione una categoría</option>'

        data.category.forEach(categoria => {
            const option = document.createElement("option")
            option.value = categoria.id_categoria
            option.textContent = categoria.nombre
            select.appendChild(option)
        });

    } catch (error) {
        console.error("Error cargando categorías:", error)
        select.innerHTML = '<option value="">Error al cargar categorías</option>'
    }
}

const cargarProveedores = async () => {

    const select = document.getElementById("supplierSelect")

    try {

        const response = await fetch(`${API_URL}/supplier_status`)
        const data = await response.json()

        if (!response.ok) {
            throw new Error("No se pudieron cargar los proveedores")
        }

        select.innerHTML = '<option value="">Seleccione un proveedor</option>'

        data.supplier.forEach(proveedor => {
            const option = document.createElement("option")
            option.value = proveedor.id_proveedor
            option.textContent = proveedor.nombre
            select.appendChild(option)
        });

    } catch (error) {
        console.error("Error cargando proveedores:", error)
        select.innerHTML = '<option value="">Error al cargar proveedores</option>'
    }
}

/**
 * Lógica de Búsqueda
 */
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

            document.getElementById("categorySelect").value = data.result.id_categoria;
            document.getElementById("supplierSelect").value = data.result.id_proveedor;
            document.getElementById("nombre").value = data.result.nombre
            document.getElementById("precio").value = data.result.precio
            document.getElementById("impuesto").value = data.result.impuesto
            document.getElementById("stock").value = data.result.stock
            document.getElementById("stock_min").value = data.result.stock_minimo

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
        }
    } catch (error) {

        Swal.fire("Error", "Error al obtener el producto: " + error.message, "error")
    }
}

/**
 * Función que decide si Guardar o Actualizar
 */
const guardarProducto = async () => {

    const getData = getFormData()
    const estadoNumerico = (getData.estado === "activo") ? 1 : 0

    // Definimos los parámetros según el modo (Edición o Registro)
    const url = editMode ? `${API_URL}/product_update` : `${API_URL}/product_register`
    const metodo = editMode ? "PUT" : "POST"
    const mensaje = editMode ? "Actualización Exitosa" : "Registro Exitoso"

    try {

        const response = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_categoria: getData.categoria,
                id_proveedor: getData.proveedor,
                codigo: getData.codigo,
                nombre: getData.nombre,
                precio: getData.precio,
                impuesto: getData.impuesto,
                stock: getData.stock,
                stock_minimo: getData.stock_min,
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

const eliminarProducto = () => {

    const id = document.getElementById("codigo").value.trim();

    if (!id) {
        return Swal.fire({
            title: "Información",
            text: "El código del producto es obligatorio.",
            icon: "info",
            confirmButtonColor: '#17a2b8'
        })
    }

    // Usamos tu función de confirmación con el color morado de MOKA
    confirmarAccion("¿Está seguro de eliminar el producto?", async () => {

        try {
            const response = await fetch(`${API_URL}/product_delete?codigo=${id}`, {
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