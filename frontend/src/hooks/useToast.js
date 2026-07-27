import { useState } from "react";


export default function useToast(){

    const [toast,setToast]=useState({

        mensaje:"",
        tipo:"success"

    });


    const mostrarToast=(mensaje,tipo="success")=>{


        setToast({

            mensaje,
            tipo

        });



        setTimeout(()=>{


            setToast({

                mensaje:"",
                tipo:"success"

            });


        },3000);



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