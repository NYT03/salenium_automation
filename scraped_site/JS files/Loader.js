
window.addEventListener("load",()=>{

    const upp = document.querySelector(".upp")
    const loader = document.querySelector(".loader")

    upp.classList.add("upp--hidden");

    loader.addEventListener("transitionend",()=>{
        document.body.removeChild(document.querySelector(".loader"));
    });
});