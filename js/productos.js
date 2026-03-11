const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if(!usuario){

        window.location.href="index.html"
        return

    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario

    // Evento para cargar los proveedores
    cargarCategorias()
    cargarProveedores()

});

/* SIDEBAR COLLAPSE */

function toggleSidebar(){

    document.getElementById("sidebar")
    .classList.toggle("collapsed")

}

/* MENU EXPAND */
function toggleMenu(element)
{
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
function logout(){

    localStorage.removeItem("usuario")
    window.location.href="index.html"

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

// Variable para controlar si estamos editando
let editMode = false

/**
 * Obtiene los datos del formulario de forma limpia
 */
const getFormData = () => {

    return {

        codigo: document.getElementById("codigo").value.trim(),
        nombre: document.getElementById("nombre").value.trim(),
        precio: document.getElementById("precio").value.trim(),
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

async function cargarCategorias() {

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