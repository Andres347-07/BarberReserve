export default function Navbar() {
  return (
    <header
      style={{
        height: 80,
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
        boxShadow: "0 2px 8px rgba(0,0,0,.05)",
      }}
    >
      <h3>BarberReserve</h3>

      <div>Administrador</div>
    </header>
  );
}