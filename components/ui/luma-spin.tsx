export function LumaSpin() {
  return (
    <div className="relative aspect-square w-[65px]">
      <span className="absolute rounded-[50px] animate-luma-spin shadow-[inset_0_0_0_3px] shadow-zinc-900 dark:shadow-zinc-100" />
      <span className="absolute rounded-[50px] animate-luma-spin [animation-delay:-1.25s] shadow-[inset_0_0_0_3px] shadow-zinc-900 dark:shadow-zinc-100" />
    </div>
  )
}
