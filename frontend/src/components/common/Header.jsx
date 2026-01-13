import Topbar from "../Layout/Topbar"
import Navbar from "./Navbar"

const Header = () => {
  return (
    <header className="border-b border-gray-200 bg-gradient-to-r from-[#047ca8] via-[#0892aa] to-[#06b6d4] text-white shadow-md relative z-50">
      <Topbar/>
      <Navbar/>
    </header>
  )
}

export default Header
