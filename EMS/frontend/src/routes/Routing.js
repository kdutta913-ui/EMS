import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../home/Home'
import Login from '../login/Login'
import Register from '../register/Register'
import CAdmin from '../dashboard/cadmin/CAdmin'
import Empdash from '../dashboard/employee/Empdash'
import Tl from '../dashboard/teamlead/Tl'
import Hrdash from '../dashboard/hr/Hrdash'
import Finance from '../dashboard/finance/Finance'
//import Super from '../dashboard/superadmin/Super'
import ChatLayout from '../chatsys/Chatlayout'
import ProtectedRoutes from '../utils/ProtectedRoutes'

const Routing = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoutes allowedRoles={['CompanyAdmin']} />}>
        <Route path="/cadmin" element={<CAdmin />} />
      </Route>

      <Route element={<ProtectedRoutes allowedRoles={['Employee']} />}>
        <Route path="/empdash" element={<Empdash />} />
      </Route>

      <Route element={<ProtectedRoutes allowedRoles={['TeamLead']} />}>
        <Route path="/teamlead" element={<Tl />} />
      </Route>

      <Route element={<ProtectedRoutes allowedRoles={['HR']} />}>
        <Route path="/hrdash" element={<Hrdash />} />
      </Route>

      <Route element={<ProtectedRoutes allowedRoles={['Finance']} />}>
        <Route path="/finance" element={<Finance />} />
      </Route>

      {/* <Route element={<ProtectedRoutes allowedRoles={['SuperAdmin']} />}>
        <Route path="/superadmin" element={<Super />} />
      </Route> */}

      <Route element={<ProtectedRoutes />}>
        <Route path="/layout" element={<ChatLayout />} />
      </Route>
    </Routes>
  )
}

export default Routing
