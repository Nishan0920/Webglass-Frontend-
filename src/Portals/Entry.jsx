import ReactDOM from 'react-dom'
const Modal = ({isopen , isclose,children})=>{
   if(!isopen) return null
   return ReactDOM.createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center '>
     <div className='relative w-full max-w-150 mt-8 p-6 mx-4 bg-blue-200 rounded-2xl '>
        <button onClick={isclose} className='text-2xl absolute top-10 right-10   md:top-8 md:right-8  cursor-pointer  '>
           X
        </button>
        <div>
            {children}
        </div>
     </div>

    </div>,
     document.getElementById('portal-root')
   )
}
export default Modal