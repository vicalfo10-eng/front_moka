document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if(!usuario){

        window.location.href="index.html";
        return;

    }

    //document.getElementById("nombreUsuario").innerText = usuario;
    document.getElementById("nombreUsuarioTop").innerText = usuario;

});

/* SIDEBAR COLLAPSE */

function toggleSidebar(){

    document.getElementById("sidebar")
    .classList.toggle("collapsed");

}

/* MENU EXPAND */
function toggleMenu(element)
{
    const sidebar = document.getElementById("sidebar");

    if(sidebar.classList.contains("collapsed"))
    {
        sidebar.classList.remove("collapsed");
        return;
    }

    const isActive = element.classList.contains("active");

        document.querySelectorAll(".menu-item").forEach(item=>{
        item.classList.remove("active");

    });

    if(!isActive)
        element.classList.add("active");
}

/* LOGOUT */
function logout(){

    localStorage.removeItem("usuario");
    window.location.href="index.html";

}