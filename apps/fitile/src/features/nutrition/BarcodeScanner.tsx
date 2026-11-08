import { useState } from 'react'
import { Barcode, Camera, Keyboard } from 'lucide-react'
import { Button } from '../../design/components/Button'

export function BarcodeScanner({onLookup}:{onLookup:(barcode:string)=>void}){const[manual,setManual]=useState('');return <section className="barcode-scanner"><div className="scanner-window"><span/><Barcode size={52}/><strong>Point at the EAN barcode</strong><small>German and European packaged foods use Open Food Facts</small></div><Button><Camera size={17}/> Start camera</Button><div className="manual-barcode"><Keyboard size={18}/><input aria-label="Enter barcode number" inputMode="numeric" value={manual} onChange={(event)=>setManual(event.target.value.replace(/\D/g,''))} placeholder="Enter barcode number"/><button onClick={()=>manual&&onLookup(manual)}>Look up</button></div></section>}
