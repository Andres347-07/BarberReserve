import { useEffect, useRef, useState } from "react";

// Tiempo suficiente para leer el mensaje (WCAG 2.2.1). Los errores
// permanecen más tiempo y siempre pueden cerrarse manualmente.
const DURACION_MS = { success: 6000, info: 6000, warning: 8000, error: 10000 };


export default function useToast(){

    const [toast,setToast]=useState({

        mensaje:"",
        tipo:"success"

    });


    const temporizador=useRef(null);

    useEffect(()=>()=>clearTimeout(temporizador.current),[]);

    const mostrarToast=(mensaje,tipo="success")=>{

        clearTimeout(temporizador.current);

        setToast({

            mensaje,
            tipo

        });

        temporizador.current=setTimeout(()=>{

            setToast({

                mensaje:"",
                tipo:"success"

            });

        },DURACION_MS[tipo]||6000);

    };



    return {

        toast,

        mostrarToast,

        cerrarToast:()=>setToast({

            mensaje:"",

            tipo:"success"

        })

    };

}