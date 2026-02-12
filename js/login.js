const API_URL = config.API_URL

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm")
    const registerForm = document.getElementById("registerForm")

    // Eventos de formularios
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin)
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister)
    }

    // Eventos de tabs
    document.querySelectorAll(".tab").forEach((btn, index) => {
        btn.addEventListener("click", () => toggleTabs(index))
    })

    // Evento para cargar los roles
    cargarRoles()

    // Mostrar / ocultar contraseña
    document.querySelectorAll(".toggle-password").forEach(icon => {

    icon.addEventListener("click", () => {

        const input = icon.previousElementSibling

        if (input.type === "password") {
            input.type = "text"
            icon.classList.remove("fa-eye")
            icon.classList.add("fa-eye-slash")
        } else {
            input.type = "password"
            icon.classList.remove("fa-eye-slash")
            icon.classList.add("fa-eye")
        }

    })

    })
})

/* =========================
    LOGIN / REGISTRO
========================= */

function toggleTabs(index) {

    const loginForm = document.getElementById("loginForm")
    const registerForm = document.getElementById("registerForm")
    const tabs = document.querySelectorAll(".tab")

    if (index === 0) {
        loginForm.classList.add("active")
        registerForm.classList.remove("active")
    } else {
        registerForm.classList.add("active")
        loginForm.classList.remove("active")
    }

    tabs.forEach(tab => tab.classList.remove("active"))
    tabs[index].classList.add("active")
}

/* =========================
   LOGIN
========================= */

async function handleLogin(e) {
    e.preventDefault()

    const correo = document.getElementById("lcorreo").value.trim();
    const contrasena = document.getElementById("lcontrasena").value.trim();

    try {

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena })
        })

        const data = await response.json()

        if (data.empty) {
            mostrarMensaje(data.data.errors[0].msg, "error")
            return
        }

        if (!response.ok) {
            mostrarMensaje(data.msg, "error")
            return
        }

        //localStorage.setItem("usuario", JSON.stringify(data.usuario))

        mostrarMensaje("Bienvenido al sistema", "success")

        setTimeout(() => {
            window.location.href = "dashboard.html"
        }, 1000)

    } catch (error) {
        mostrarMensaje(error.message, "error")
        console.error("Error login:", error)
    }
}

/* =========================
   CARGA ROLES
========================= */

async function cargarRoles() {

    const select = document.getElementById("roleSelect");

    try {

        const response = await fetch(`${API_URL}/roles`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error("No se pudieron cargar los roles");
        }

        select.innerHTML = '<option value="">Seleccione un rol</option>';

        data.rol.forEach(rol => {
            const option = document.createElement("option");
            option.value = rol.id_rol;
            option.textContent = rol.nombre;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando roles:", error);
        select.innerHTML = '<option value="">Error al cargar roles</option>';
    }
}

/* =========================
   REGISTRO
========================= */

async function handleRegister(e) {
    e.preventDefault()

    const identificacion = document.getElementById("identificacion").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();
    const id_rol = document.getElementById("roleSelect").value;

    console.log({ id_rol, identificacion, nombre, correo, contrasena })

    try {

        const response = await fetch(`${API_URL}/user_register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_rol, identificacion, nombre, correo, contrasena })
        })
        
        const data = await response.json()

        if (data.empty) {
            mostrarMensaje(data.data.errors[0].msg, "error")
            return
        }

        if (!data.ok) {
            mostrarMensaje(data.msg, "error")
            return
        }

        mostrarMensaje("Usuario creado correctamente", "success")

        toggleTabs(0) // volver a login
        e.target.reset(); // limpiar formulario

    } catch (error) {
        mostrarMensaje(error.message, "error")
        console.error("Error registro:", error)
    }
}

/* =========================
   MENSAJES
========================= */

function mostrarMensaje(mensaje, tipo) {

    let div = document.getElementById("mensaje")

    if (!div) {
        div = document.createElement("div")
        div.id = "mensaje"
        document.querySelector(".auth-card").prepend(div)
    }

    div.innerText = mensaje
    div.className = `alert ${tipo}`

    setTimeout(() => {
        div.remove()
    }, 3000)
}