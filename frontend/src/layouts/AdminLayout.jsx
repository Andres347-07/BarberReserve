import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import "./AdminLayout.css";

export default function AdminLayout() {

    return (

        <div className="admin-layout">

            <Sidebar />

            <div className="admin-content">

                <Navbar />

                <main className="admin-main">

                    <Outlet />

                </main>

                <Footer />

            </div>

        </div>

    );

}