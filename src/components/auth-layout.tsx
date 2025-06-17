import Sidebar from "./sidebar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-10 overflow-y-auto">{children}</main>
      </div>
    </>
  );
};

export default AdminLayout;
