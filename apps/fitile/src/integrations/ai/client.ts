import { supabase } from '../supabase/client'
import type { FoodPhotoAnalysisClient, FoodPhotoEstimate } from './types'

const blobToDataUrl=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})
export const supabaseFoodPhotoClient:FoodPhotoAnalysisClient={async analyze(image){if(!supabase)throw new Error('ai-not-configured');const imageDataUrl=await blobToDataUrl(image);const{data,error}=await supabase.functions.invoke<FoodPhotoEstimate>('analyze-food-photo',{body:{imageDataUrl}});if(error||!data)throw new Error(error?.message??'analysis-unavailable');return data}}
export async function requestAiWorkout(input:Record<string,unknown>){if(!supabase)throw new Error('ai-not-configured');const{data,error}=await supabase.functions.invoke('ai-workout',{body:input});if(error)throw new Error(error.message);return data}
