/* eslint-disable prettier/prettier */
/* eslint-disable no-useless-escape */
export enum ValidationRegex {
  Email = "/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/",
  PhoneNumber = "/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/",
  Username = "/^[a-zA-Z0-9]+([_ -]?[a-zA-Z0-9])*$/",
}
