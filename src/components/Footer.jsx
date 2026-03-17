export default function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} GrigliApp</div>
      <div className="footer-names">
        Creato da <strong>Bortolato</strong>, <strong>Gomiero</strong>, <strong>Brognera</strong>, <strong>Saccon</strong>
      </div>
    </footer>
  )
}
