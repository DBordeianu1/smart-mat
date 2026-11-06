// Line icons for the Home screen cards (24x24, inherit text color), from lucide-react
import { AudioLines, Info, PartyPopper, Sun, TriangleAlert, Waves, Wind, X, Zap } from 'lucide-react'

const STROKE = 1.8

export const PraiseIcon = () => <PartyPopper strokeWidth={STROKE} aria-hidden="true" />
export const SoundIcon = () => <AudioLines strokeWidth={STROKE} aria-hidden="true" />
export const SunIcon = () => <Sun strokeWidth={STROKE} aria-hidden="true" />
export const CalmIcon = () => <Waves strokeWidth={STROKE} aria-hidden="true" />
export const WhistleIcon = () => <Wind strokeWidth={STROKE} aria-hidden="true" />
export const ZapIcon = () => <Zap strokeWidth={STROKE} aria-hidden="true" />
export const InfoIcon = () => <Info strokeWidth={STROKE} aria-hidden="true" />
export const CloseIcon = () => <X strokeWidth={STROKE} aria-hidden="true" />
export const AlertIcon = () => <TriangleAlert strokeWidth={STROKE} aria-hidden="true" />
