function Navbar({ storeName }) {
  return (
    <nav>
      <h2>{storeName}</h2>

      <div>
        <span>Products</span>
        <span>Cart</span>
        <span>Login</span>
      </div>
    </nav>
  );
}

export default Navbar;