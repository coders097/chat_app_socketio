import React from 'react';
import Pic from '../assets/logo.png';

function PNF(props) {
    return (
        <section className="PNF" style={styles['pnf']}>
            <img src={Pic} alt="logo" style={styles.img}/>
            <h1 style={styles.h1}>404</h1>
            <p style={styles.p}>Seems like your lost in this world!</p>
            <button className="btn">Go To Home</button>
        </section>
    );
}


const styles={
    pnf:{
        width:"100%",
        height:"100vh",
        display:"flex",
        "justify-content":"center",
        "align-items":"center",
        "gap":"15px",
        "flex-direction":"column"
    },
    img:{
        width:"200px",
        height:"200px"
    },
    h1:{
        "font-size":"8rem",
        color:"var(--text-dark)"
    },
    p:{
        "font-size":"2rem",
        color:"var(--text-light)",
        "text-align":"center",
        "width":"85%"
    }
}
export default PNF;