using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using PortableDeviceApiLib;
using PortableDeviceTypesLib;

namespace IPhonePhotoReader
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                var deviceManager = new PortableDeviceManager();
                deviceManager.RefreshDeviceList();

                uint deviceCount = 0;
                deviceManager.GetDevices(null, ref deviceCount);

                if (deviceCount == 0)
                {
                    Console.WriteLine("NO_DEVICES");
                    return;
                }

                var deviceIds = new string[deviceCount];
                deviceManager.GetDevices(deviceIds, ref deviceCount);

                foreach (var deviceId in deviceIds)
                {
                    uint nameLen = 0;
                    deviceManager.GetDeviceFriendlyName(deviceId, null, ref nameLen);
                    
                    char[] nameChars = new char[nameLen];
                    deviceManager.GetDeviceFriendlyName(deviceId, nameChars, ref nameLen);
                    string deviceName = new string(nameChars, 0, (int)nameLen - 1);

                    if (deviceName.Contains("iPhone") || deviceName.Contains("iPad"))
                    {
                        Console.WriteLine($"DEVICE_FOUND:{deviceName}");
                        
                        var device = new PortableDevice();
                        device.Open(deviceId, GetClientInfo());

                        IPortableDeviceContent content;
                        device.Content(out content);

                        IPortableDeviceProperties properties;
                        content.Properties(out properties);

                        // Start from root
                        EnumerateContents(content, properties, "DEVICE", 0);
                        
                        device.Close();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR:{ex.Message}");
            }
        }

        static void EnumerateContents(IPortableDeviceContent content, IPortableDeviceProperties properties, 
                                     string parentId, int depth)
        {
            if (depth > 10) return;

            IEnumPortableDeviceObjectIDs objectIds;
            content.EnumObjects(0, parentId, null, out objectIds);

            uint fetched = 0;
            do
            {
                string objectId;
                objectIds.Next(1, out objectId, ref fetched);
                
                if (fetched > 0)
                {
                    IPortableDeviceKeyCollection keys;
                    content.Properties(out var props);
                    props.GetSupportedProperties(objectId, out keys);

                    IPortableDeviceValues values;
                    props.GetValues(objectId, keys, out values);

                    string name = "";
                    try
                    {
                        values.GetStringValue(ref PortableDevicePKeys.WPD_OBJECT_NAME, out name);
                    }
                    catch { }

                    uint contentType = 0;
                    try
                    {
                        values.GetUnsignedIntegerValue(ref PortableDevicePKeys.WPD_OBJECT_CONTENT_TYPE, out contentType);
                    }
                    catch { }

                    // Check if it's a folder
                    Guid contentTypeGuid = new Guid(contentType, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
                    if (contentTypeGuid == PortableDeviceGuids.WPD_CONTENT_TYPE_FOLDER)
                    {
                        if (name == "DCIM" || name.Contains("Camera"))
                        {
                            Console.WriteLine($"DCIM_FOUND:{objectId}");
                        }
                        
                        // Recurse into folder
                        EnumerateContents(content, properties, objectId, depth + 1);
                    }
                    else
                    {
                        // Check if it's an image
                        string extension = Path.GetExtension(name).ToLower();
                        if (extension == ".jpg" || extension == ".jpeg" || extension == ".png" || 
                            extension == ".heic" || extension == ".heif")
                        {
                            ulong size = 0;
                            try
                            {
                                values.GetUnsignedLargeIntegerValue(ref PortableDevicePKeys.WPD_OBJECT_SIZE, out size);
                            }
                            catch { }

                            Console.WriteLine($"PHOTO:{name}|{objectId}|{size}");
                        }
                    }
                }
            } while (fetched > 0);
        }

        static IPortableDeviceValues GetClientInfo()
        {
            var clientInfo = (IPortableDeviceValues)new PortableDeviceValues();
            
            clientInfo.SetStringValue(ref PortableDevicePKeys.WPD_CLIENT_NAME, "iPhoto Viewer");
            clientInfo.SetUnsignedIntegerValue(ref PortableDevicePKeys.WPD_CLIENT_MAJOR_VERSION, 1);
            clientInfo.SetUnsignedIntegerValue(ref PortableDevicePKeys.WPD_CLIENT_MINOR_VERSION, 0);
            clientInfo.SetUnsignedIntegerValue(ref PortableDevicePKeys.WPD_CLIENT_REVISION, 0);
            
            return clientInfo;
        }
    }

    public static class PortableDevicePKeys
    {
        public static readonly PropertyKey WPD_OBJECT_NAME = new PropertyKey(
            new Guid(0xEF6B490D, 0x5CD8, 0x437A, 0xAF, 0xFC, 0xDA, 0x8B, 0x60, 0xEE, 0x4A, 0x3C), 4);
        
        public static readonly PropertyKey WPD_OBJECT_CONTENT_TYPE = new PropertyKey(
            new Guid(0xEF6B490D, 0x5CD8, 0x437A, 0xAF, 0xFC, 0xDA, 0x8B, 0x60, 0xEE, 0x4A, 0x3C), 7);
        
        public static readonly PropertyKey WPD_OBJECT_SIZE = new PropertyKey(
            new Guid(0xEF6B490D, 0x5CD8, 0x437A, 0xAF, 0xFC, 0xDA, 0x8B, 0x60, 0xEE, 0x4A, 0x3C), 11);

        public static readonly PropertyKey WPD_CLIENT_NAME = new PropertyKey(
            new Guid(0x204D9F0C, 0x2292, 0x4080, 0x9F, 0x42, 0x40, 0x66, 0x4E, 0x70, 0xF8, 0x59), 2);
        
        public static readonly PropertyKey WPD_CLIENT_MAJOR_VERSION = new PropertyKey(
            new Guid(0x204D9F0C, 0x2292, 0x4080, 0x9F, 0x42, 0x40, 0x66, 0x4E, 0x70, 0xF8, 0x59), 3);
        
        public static readonly PropertyKey WPD_CLIENT_MINOR_VERSION = new PropertyKey(
            new Guid(0x204D9F0C, 0x2292, 0x4080, 0x9F, 0x42, 0x40, 0x66, 0x4E, 0x70, 0xF8, 0x59), 4);
        
        public static readonly PropertyKey WPD_CLIENT_REVISION = new PropertyKey(
            new Guid(0x204D9F0C, 0x2292, 0x4080, 0x9F, 0x42, 0x40, 0x66, 0x4E, 0x70, 0xF8, 0x59), 5);
    }

    public static class PortableDeviceGuids
    {
        public static readonly Guid WPD_CONTENT_TYPE_FOLDER = 
            new Guid(0x27E2E392, 0xA111, 0x48E0, 0xAB, 0x0C, 0xE1, 0x77, 0x05, 0xA0, 0x5F, 0x85);
    }

    [StructLayout(LayoutKind.Sequential, Pack = 4)]
    public struct PropertyKey
    {
        public Guid fmtid;
        public uint pid;
        
        public PropertyKey(Guid guid, uint id)
        {
            fmtid = guid;
            pid = id;
        }
    }
}
